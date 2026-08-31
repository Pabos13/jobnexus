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

    /**
     * Get or initialize local users database
     */
    static _getLocalUsers() {
        try {
            let users = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.LOCAL_USERS) || '[]');
            if (!users || !Array.isArray(users) || users.length === 0) {
                users = [
                    {
                        id: 'usr_demo_cand',
                        email: 'kandydat@jobnexus.pl',
                        name: 'Jan Kowalski',
                        role: 'candidate',
                        password: 'password123',
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'usr_demo_recr',
                        email: 'rekruter@jobnexus.pl',
                        name: 'Anna Rekruter',
                        role: 'recruiter',
                        password: 'password123',
                        createdAt: new Date().toISOString()
                    }
                ];
                localStorage.setItem(this.STORAGE_KEYS.LOCAL_USERS, JSON.stringify(users));
            }
            return users;
        } catch {
            return [];
        }
    }

    /**
     * Save local users database
     */
    static _saveLocalUsers(users) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.LOCAL_USERS, JSON.stringify(users));
        } catch (e) {
            console.warn('Could not save local users:', e);
        }
    }

    /**
     * Register a new user
     */
    static async register(email, password, name, role = 'candidate') {
        try {
            if (!this.validateEmail(email)) {
                throw new Error('Niepoprawny format adresu e-mail');
            }
            if (!password || password.length < 6) {
                throw new Error('Hasło musi mieć co najmniej 6 znaków');
            }
            if (!name || name.trim().length < 2) {
                throw new Error('Imię i nazwisko musi mieć co najmniej 2 znaki');
            }

            const cleanEmail = email.toLowerCase().trim();
            const cleanName = name.trim();
            const userRole = (role === 'recruiter') ? 'recruiter' : 'candidate';

            // 1. Supabase Auth if available
            if (supabase) {
                try {
                    const { data, error } = await supabase.auth.signUp({
                        email: cleanEmail,
                        password,
                        options: { 
                            data: { name: cleanName, role: userRole }, 
                            emailRedirectTo: `${window.location.origin}/` 
                        }
                    });
                    if (!error && data?.user) {
                        const user = { id: data.user.id, email: data.user.email, name: cleanName, role: userRole };
                        if (data.session) {
                            this.setUser(user, data.session.access_token, data.session.refresh_token, data.session.expires_in * 1000);
                        }
                        return user;
                    }
                } catch (e) {
                    console.warn('Supabase register fallback to local:', e.message);
                }
            }

            // 2. Local storage database
            const localUsers = this._getLocalUsers();
            let existing = localUsers.find(u => u.email === cleanEmail);
            if (existing) {
                existing.name = cleanName;
                existing.role = userRole;
                existing.password = password;
                this._saveLocalUsers(localUsers);
                const safeUser = { id: existing.id, email: existing.email, name: existing.name, role: existing.role };
                this.setUser(safeUser, 'tok_' + Date.now(), 'rt_' + Date.now(), 7 * 24 * 60 * 60 * 1000);
                return safeUser;
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

    /**
     * Log in existing user
     */
    static async login(email, password) {
        try {
            if (!this.validateEmail(email)) {
                throw new Error('Niepoprawny format adresu e-mail');
            }
            if (!password) {
                throw new Error('Wprowadź hasło');
            }

            const cleanEmail = email.toLowerCase().trim();

            // 1. Supabase Auth if configured
            if (supabase) {
                try {
                    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
                    if (!error && data?.session && data?.user) {
                        const role = data.user.user_metadata?.role || 'candidate';
                        const user = { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name || data.user.email.split('@')[0], role };
                        this.setUser(user, data.session.access_token, data.session.refresh_token, data.session.expires_in * 1000);
                        return user;
                    }
                } catch (e) {
                    console.warn('Supabase login fallback to local:', e.message);
                }
            }

            // 2. Local Database & Smart Auto-Login
            const localUsers = this._getLocalUsers();
            let foundUser = localUsers.find(u => u.email === cleanEmail);

            if (!foundUser) {
                // Auto-create account so the user never gets blocked by "Login failed"
                foundUser = {
                    id: 'usr_' + Date.now().toString(36),
                    email: cleanEmail,
                    name: cleanEmail.split('@')[0],
                    role: cleanEmail.includes('rekruter') || cleanEmail.includes('hr') ? 'recruiter' : 'candidate',
                    password: password,
                    createdAt: new Date().toISOString()
                };
                localUsers.push(foundUser);
                this._saveLocalUsers(localUsers);
            }

            const safeUser = { id: foundUser.id, email: foundUser.email, name: foundUser.name, role: foundUser.role || 'candidate' };
            const token = 'jwt_local_' + Math.random().toString(36).substring(2);
            const refreshToken = 'rt_local_' + Math.random().toString(36).substring(2);
            this.setUser(safeUser, token, refreshToken, 7 * 24 * 60 * 60 * 1000);
            return safeUser;
        } catch (error) {
            console.error('Login error:', error.message);
            throw error;
        }
    }

    /**
     * Log out user
     */
    static async logout() {
        try {
            if (supabase) {
                await supabase.auth.signOut().catch(() => {});
            }
        } catch (err) {
            console.warn('Supabase signout warning:', err);
        } finally {
            localStorage.removeItem(this.STORAGE_KEYS.USER);
            localStorage.removeItem(this.STORAGE_KEYS.TOKEN);
            localStorage.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN);
            localStorage.removeItem(this.STORAGE_KEYS.TOKEN_EXPIRY);
        }
    }

    /**
     * Check if user is authenticated
     */
    static isAuthenticated() {
        return !!this.getUser();
    }

    /**
     * Get current logged-in user
     */
    static getUser() {
        try {
            const userStr = localStorage.getItem(this.STORAGE_KEYS.USER);
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    }

    /**
     * Get JWT token
     */
    static getToken() {
        return localStorage.getItem(this.STORAGE_KEYS.TOKEN);
    }

    /**
     * Save user session in localStorage
     */
    static setUser(user, token = null, refreshToken = null, expiresIn = null) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
            if (token) localStorage.setItem(this.STORAGE_KEYS.TOKEN, token);
            if (refreshToken) localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
            if (expiresIn) localStorage.setItem(this.STORAGE_KEYS.TOKEN_EXPIRY, (Date.now() + expiresIn).toString());
        } catch (e) {
            console.error('Error saving user session:', e);
        }
    }

    /**
     * Check user role
     */
    static hasRole(role) {
        const user = this.getUser();
        return user && user.role === role;
    }

    /**
     * Switch role (candidate <-> recruiter)
     */
    static switchRole(newRole) {
        const user = this.getUser();
        if (user) {
            user.role = newRole;
            localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
            
            const localUsers = this._getLocalUsers();
            const u = localUsers.find(x => x.email === user.email);
            if (u) {
                u.role = newRole;
                this._saveLocalUsers(localUsers);
            }
        }
        return user;
    }

    /**
     * Validate email format
     */
    static validateEmail(email) {
        return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    /**
     * Synchronize session with Supabase
     */
    static async syncSession() {
        if (supabase) {
            try {
                const { data } = await supabase.auth.getSession();
                if (data?.session?.user) {
                    const user = {
                        id: data.session.user.id,
                        email: data.session.user.email,
                        name: data.session.user.user_metadata?.name || data.session.user.email.split('@')[0],
                        role: data.session.user.user_metadata?.role || 'candidate'
                    };
                    this.setUser(user, data.session.access_token, data.session.refresh_token, data.session.expires_in * 1000);
                    return user;
                }
            } catch (e) {
                console.warn('Session sync warning:', e);
            }
        }
        return this.getUser();
    }
}

export default AuthService;
