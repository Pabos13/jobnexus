/**
 * Authentication Service
 * Handles user login, registration, roles, and JWT token management
 * Supports Backend API, Supabase Auth, and Client-side LocalStorage fallback.
 */

import { CONFIG } from '../config.js';

export class AuthService {
    static STORAGE_KEYS = {
        USER: 'jobnexus_user',
        TOKEN: 'jobnexus_token',
        REFRESH_TOKEN: 'jobnexus_refresh_token',
        TOKEN_EXPIRY: 'jobnexus_token_expiry',
        LOCAL_USERS: 'jobnexus_local_registered_users'
    };

    static validateEmail(email) {
        if (!email || typeof email !== 'string') return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    }

    static _getLocalUsers() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.LOCAL_USERS) || '[]');
        } catch (e) {
            return [];
        }
    }

    static _saveLocalUsers(users) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.LOCAL_USERS, JSON.stringify(users));
        } catch (e) {
            console.warn('Save local users error:', e);
        }
    }

    static async register(email, password, name = '', role = 'candidate') {
        if (!email || !this.validateEmail(email)) {
            throw new Error('Podaj poprawny adres e-mail');
        }
        if (!password || password.length < 6) {
            throw new Error('Hasło musi mieć co najmniej 6 znaków');
        }
        if (!name || name.trim().length < 2) {
            throw new Error('Podaj imię i nazwisko lub nazwę firmy (min. 2 znaki)');
        }

        const cleanEmail = email.toLowerCase().trim();
        const cleanName = name.trim();
        const userRole = (role === 'recruiter') ? 'recruiter' : 'candidate';

        if (CONFIG.API_BASE_URL && typeof CONFIG.API_BASE_URL === 'string' && CONFIG.API_BASE_URL.startsWith('http')) {
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: cleanEmail, password, name: cleanName })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.user) {
                        this.setUser(data.user, data.token || 'tok_' + Date.now(), data.refreshToken, data.expiresIn);
                        return data.user;
                    }
                } else if (response.status !== 404 && response.status !== 502) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.message || 'Rejestracja nie powiodła się');
                }
            } catch (err) {
                if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('fetch') && !err.message.includes('404')) {
                    throw err;
                }
            }
        }

        const users = this._getLocalUsers();
        let existing = users.find(u => u.email === cleanEmail);
        if (existing) {
            throw new Error('Konto z tym adresem e-mail już istnieje. Zaloguj się.');
        }

        const newUser = {
            id: 'usr_' + Date.now(),
            email: cleanEmail,
            name: cleanName,
            role: userRole,
            password: password,
            plan: userRole === 'recruiter' ? 'pro' : 'standard',
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        this._saveLocalUsers(users);

        const safeUser = { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, plan: newUser.plan };
        this.setUser(safeUser, 'tok_local_' + Date.now(), 'rt_local_' + Date.now(), 7 * 24 * 3600 * 1000);
        return safeUser;
    }

    static async login(email, password) {
        if (!email || !this.validateEmail(email)) {
            throw new Error('Podaj poprawny adres e-mail');
        }
        if (!password) {
            throw new Error('Wpisz hasło');
        }

        const cleanEmail = email.toLowerCase().trim();

        if (CONFIG.API_BASE_URL && typeof CONFIG.API_BASE_URL === 'string' && CONFIG.API_BASE_URL.startsWith('http')) {
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: cleanEmail, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.user) {
                        this.setUser(data.user, data.token || 'tok_' + Date.now(), data.refreshToken, data.expiresIn);
                        return data.user;
                    }
                } else if (response.status !== 404 && response.status !== 502) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.message || 'Nieprawidłowe dane logowania');
                }
            } catch (err) {
                if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('fetch') && !err.message.includes('404')) {
                    throw err;
                }
            }
        }

        const users = this._getLocalUsers();
        let found = users.find(u => u.email === cleanEmail);
        if (!found) {
            throw new Error('Konto z tym adresem e-mail nie istnieje. Zarejestruj się najpierw.');
        }

        if (found.password && found.password !== password) {
            throw new Error('Nieprawidłowe hasło. Spróbuj ponownie.');
        }

        const safeUser = { id: found.id, email: found.email, name: found.name, role: found.role || 'candidate', plan: found.plan || 'standard' };
        this.setUser(safeUser, 'tok_local_' + Date.now(), 'rt_local_' + Date.now(), 7 * 24 * 3600 * 1000);
        return safeUser;
    }

    static setUser(user, token = 'token', refreshToken = null, expiresIn = 7 * 24 * 3600 * 1000) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
            if (token) localStorage.setItem(this.STORAGE_KEYS.TOKEN, token);
            if (refreshToken) localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
            if (expiresIn) {
                const expiryTime = Date.now() + Number(expiresIn);
                localStorage.setItem(this.STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
            }
            if (typeof window !== 'undefined') {
                window.currentUser = user;
                if (typeof window.syncUserHeader === 'function') {
                    window.syncUserHeader(user);
                }
            }
        } catch (e) {
            console.warn('SetUser error:', e);
        }
    }

    static getUser() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEYS.USER);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    static getToken() {
        try {
            return localStorage.getItem(this.STORAGE_KEYS.TOKEN);
        } catch (e) {
            return null;
        }
    }

    static isAuthenticated() {
        const user = this.getUser();
        if (!user) return false;
        const expiry = localStorage.getItem(this.STORAGE_KEYS.TOKEN_EXPIRY);
        if (expiry && Date.now() > Number(expiry)) {
            return false;
        }
        return true;
    }

    static async logout() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.USER);
            localStorage.removeItem(this.STORAGE_KEYS.TOKEN);
            localStorage.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN);
            localStorage.removeItem(this.STORAGE_KEYS.TOKEN_EXPIRY);
            if (typeof window !== 'undefined') {
                window.currentUser = null;
                if (typeof window.syncUserHeader === 'function') {
                    window.syncUserHeader(null);
                }
            }
        } catch (e) {
            console.warn('Logout error:', e);
        }
    }

    static async refreshToken() {
        const refreshToken = localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
        if (!refreshToken) throw new Error('No refresh token available');

        const apiBase = CONFIG.API_BASE_URL || '';
        const response = await fetch(`${apiBase}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${refreshToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Token refresh failed');
        }

        const data = await response.json();
        if (data.token) {
            localStorage.setItem(this.STORAGE_KEYS.TOKEN, data.token);
            if (data.expiresIn) {
                localStorage.setItem(this.STORAGE_KEYS.TOKEN_EXPIRY, (Date.now() + Number(data.expiresIn)).toString());
            }
            return data.token;
        }
        throw new Error('Invalid refresh response');
    }

    static async updateProfile(updates = {}) {
        const currentUser = this.getUser();
        if (!currentUser) throw new Error('User not logged in');

        const token = this.getToken();
        const apiBase = CONFIG.API_BASE_URL || '';
        const response = await fetch(`${apiBase}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            throw new Error('Update profile failed');
        }

        const data = await response.json();
        const updated = { ...currentUser, ...(data.user || updates) };
        this.setUser(updated, token);
        return updated;
    }
}

if (typeof window !== 'undefined') {
    window.AuthService = AuthService;
}

export default AuthService;
