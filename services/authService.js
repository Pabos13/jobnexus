/**
 * Authentication Service
 * Handles user login, registration, roles, and JWT token management
 * Supports Supabase Auth, Backend API, and Client-side LocalStorage fallback.
 */

import { StorageService } from './storageService.js';
import { CONFIG } from '../config.js';
import { supabase } from './supabaseClient.js';

export class AuthService {
    static STORAGE_KEYS = {
        USER: 'jobnexus_user',
        TOKEN: 'jobnexus_token',
        REFRESH_TOKEN: 'jobnexus_refresh_token',
        TOKEN_EXPIRY: 'jobnexus_token_expiry',
        LOCAL_USERS: 'jobnexus_local_registered_users',
        SAVED_JOBS: 'jobnexus_saved_jobs',
        APPLICATIONS: 'jobnexus_applications',
        RECRUITER_JOBS: 'jobnexus_recruiter_jobs'
    };

    static _getLocalUsers() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.LOCAL_USERS) || '[]');
        } catch {
            return [];
        }
    }

    static _saveLocalUsers(users) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.LOCAL_USERS, JSON.stringify(users));
        } catch (e) {
            console.warn('Could not save local users:', e);
        }
    }

    static async register(email, password, name, role = 'candidate') {
        try {
            if (!this.validateEmail(email)) {
                throw new Error('Invalid email format');
            }
            if (!password || password.length < 8) {
                throw new Error('Password must be at least 8 characters');
            }
            if (!name || name.trim().length < 2) {
                throw new Error('Name must be at least 2 characters');
            }

            const cleanEmail = email.toLowerCase().trim();
            const cleanName = name.trim();
            const userRole = (role === 'recruiter') ? 'recruiter' : 'candidate';

            if (supabase) {
                const { data, error } = await supabase.auth.signUp({
                    email: cleanEmail,
                    password,
                    options: { 
                        data: { name: cleanName, role: userRole }, 
                        emailRedirectTo: `${window.location.origin}/` 
                    }
                });
                if (error) {
                    const message = error.message?.toLowerCase() || '';
                    if (message.includes('already') || message.includes('registered')) {
                        throw new Error('Użytkownik z tym adresem e-mail już istnieje.');
                    }
                    throw new Error('Nie udało się utworzyć konta. Spróbuj ponownie.');
                }
                const user = data.user ? { id: data.user.id, email: data.user.email, name: cleanName, role: userRole } : null;
                if (user && data.session) {
                    this.setUser(user, data.session.access_token, data.session.refresh_token, data.session.expires_in * 1000);
                }
                return user;
            }

            let backendSuccess = false;
            let backendData = null;
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: cleanEmail,
                        password,
                        name: cleanName,
                        role: userRole
                    }),
                    timeout: CONFIG.API_TIMEOUT
                });

                if (response.ok) {
                    backendData = await response.json();
                    backendSuccess = true;
                } else if (response.status !== 404) {
                    let errData;
                    try { errData = await response.json(); } catch { errData = {}; }
                    throw new Error(errData.message || 'Registration failed');
                }
            } catch (err) {
                if (err.message && err.message !== 'Failed to fetch' && !err.message.includes('NetworkError') && err.message !== 'Registration failed') {
                    throw err;
                }
            }

            if (backendSuccess && backendData) {
                const u = { ...backendData.user, role: backendData.user.role || userRole };
                this.setUser(u, backendData.token, backendData.refreshToken, backendData.expiresIn || (7 * 24 * 60 * 60 * 1000));
                return u;
            }

            const localUsers = this._getLocalUsers();
            if (localUsers.some(u => u.email === cleanEmail)) {
                throw new Error('Użytkownik z tym adresem e-mail już istnieje. Zaloguj się.');
            }

            const newUser = {
                id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
                email: cleanEmail,
                name: cleanName,
                role: userRole,
                password: password,
                createdAt: new Date().toISOString()
            };

            localUsers.push(newUser);
            this._saveLocalUsers(localUsers);

            const safeUser = { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role };
            const token = 'jwt_local_' + Math.random().toString(36).substring(2);
            const refreshToken = 'rt_local_' + Math.random().toString(36).substring(2);
            this.setUser(safeUser, token, refreshToken, 7 * 24 * 60 * 60 * 1000);

            return safeUser;
        } catch (error) {
            console.error('Registration error:', error.message);
            throw error;
        }
    }

    static async login(email, password) {
        try {
            if (!this.validateEmail(email)) {
                throw new Error('Invalid email format');
            }
            if (!password) {
                throw new Error('Password is required');
            }

            const cleanEmail = email.toLowerCase().trim();

            if (supabase) {
                const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
                if (error) {
                    const message = error.message?.toLowerCase() || '';
                    if (message.includes('invalid login') || message.includes('invalid credentials') || message.includes('email or password')) {
                        throw new Error('Nieprawidłowy e-mail lub hasło');
                    }
                    throw new Error('Logowanie nie powiodło się. Spróbuj ponownie.');
                }
                if (!data.session || !data.user) {
                    throw new Error('Nie udało się utworzyć sesji. Spróbuj ponownie.');
                }
                const role = data.user.user_metadata?.role || 'candidate';
                const user = { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name || data.user.email, role };
                this.setUser(user, data.session.access_token, data.session.refresh_token, data.session.expires_in * 1000);
                return user;
            }

            let backendSuccess = false;
            let backendData = null;
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: cleanEmail,
                        password
                    }),
                    timeout: CONFIG.API_TIMEOUT
                });

                if (response.ok) {
                    backendData = await response.json();
                    backendSuccess = true;
                } else if (response.status !== 404) {
                    let errMessage = 'Invalid credentials';
                    try {
                        const errObj = await response.json();
                        errMessage = errObj.message || errMessage;
                    } catch {}
                    throw new Error(errMessage);
                }
            } catch (err) {
                if (err.message && err.message !== 'Failed to fetch' && !err.message.includes('NetworkError') && err.message !== 'Login failed') {
                    throw err;
                }
            }

            if (backendSuccess && backendData) {
                this.setUser(backendData.user, backendData.token, backendData.refreshToken, backendData.expiresIn || (7 * 24 * 60 * 60 * 1000));
                return backendData.user;
            }

            const localUsers = this._getLocalUsers();
            const foundUser = localUsers.find(u => u.email === cleanEmail);

            if (foundUser) {
                if (foundUser.password !== password) {
                    throw new Error('Nieprawidłowe hasło. Spróbuj ponownie.');
                }
                const safeUser = { id: foundUser.id, email: foundUser.email, name: foundUser.name, role: foundUser.role || 'candidate' };
                const token = 'jwt_local_' + Math.random().toString(36).substring(2);
                const refreshToken = 'rt_local_' + Math.random().toString(36).substring(2);
                this.setUser(safeUser, token, refreshToken, 7 * 24 * 60 * 60 * 1000);
                return safeUser;
            }

            throw new Error('Nie znaleziono konta z tym adresem e-mail. Zarejestruj się.');
        } catch (error) {
            console.error('Login error:', error.message);
            throw error;
        }
    }

    static async syncSession() {
        if (supabase) {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error || !data.session?.user) {
                    this.clearStoredSession();
                    return null;
                }
                const authUser = data.session.user;
                const role = authUser.user_metadata?.role || 'candidate';
                const user = {
                    id: authUser.id,
                    email: authUser.email,
                    name: authUser.user_metadata?.name || authUser.email,
                    role
                };
                this.setUser(user, data.session.access_token, data.session.refresh_token, data.session.expires_in * 1000);
                return user;
            } catch (e) {
                console.warn('Supabase getSession failed:', e);
            }
        }

        if (this.isAuthenticated()) {
            return this.getUser();
        }

        return null;
    }

    static clearStoredSession() {
        Object.values(this.STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    }

    static async logout() {
        try {
            if (supabase) await supabase.auth.signOut();
        } catch (error) {
            console.warn('Logout error:', error);
        }
        localStorage.removeItem(this.STORAGE_KEYS.USER);
        localStorage.removeItem(this.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(this.STORAGE_KEYS.TOKEN_EXPIRY);
    }

    static getUser() {
        try {
            const user = localStorage.getItem(this.STORAGE_KEYS.USER);
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.warn('Error getting user:', error);
            return null;
        }
    }

    static updateRole(newRole) {
        const user = this.getUser();
        if (user) {
            user.role = newRole;
            localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));

            const localUsers = this._getLocalUsers();
            const idx = localUsers.findIndex(u => u.email === user.email);
            if (idx !== -1) {
                localUsers[idx].role = newRole;
                this._saveLocalUsers(localUsers);
            }
        }
        return user;
    }

    static getToken() {
        return localStorage.getItem(this.STORAGE_KEYS.TOKEN);
    }

    static isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;
        const expiry = localStorage.getItem(this.STORAGE_KEYS.TOKEN_EXPIRY);
        if (!expiry) return false;
        return Date.now() < parseInt(expiry);
    }

    static async refreshToken() {
        try {
            const refreshToken = localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
            if (!refreshToken) {
                this.logout();
                throw new Error('No refresh token available');
            }

            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${refreshToken}`
                },
                timeout: CONFIG.API_TIMEOUT
            });

            if (!response.ok) {
                this.logout();
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            localStorage.setItem(this.STORAGE_KEYS.TOKEN, data.token);
            localStorage.setItem(this.STORAGE_KEYS.TOKEN_EXPIRY, Date.now() + (data.expiresIn || 3600000));
            return data.token;
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout();
            throw error;
        }
    }

    static async updateProfile(updates) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            let updatedUser = { ...this.getUser(), ...updates };
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/auth/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getToken()}`
                    },
                    body: JSON.stringify(updates),
                    timeout: CONFIG.API_TIMEOUT
                });

                if (response.ok) {
                    const data = await response.json();
                    updatedUser = { ...this.getUser(), ...data.user };
                }
            } catch {}

            localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(updatedUser));
            return updatedUser;
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    }

    static setUser(user, token, refreshToken, expiresIn = 7 * 24 * 60 * 60 * 1000) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
            if (token) localStorage.setItem(this.STORAGE_KEYS.TOKEN, token);
            if (refreshToken) localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
            const expiryTime = typeof expiresIn === 'number' && expiresIn < 10000000000 ? (Date.now() + expiresIn) : expiresIn;
            localStorage.setItem(this.STORAGE_KEYS.TOKEN_EXPIRY, String(expiryTime));
        } catch (error) {
            console.error('Error setting user:', error);
        }
    }

    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}

export default AuthService;
