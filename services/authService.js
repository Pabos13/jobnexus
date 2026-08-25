/**
 * Authentication Service
 * Handles user login, registration, and JWT token management
 */

import { StorageService } from './storageService.js';
import { CONFIG } from '../config.js';
import { supabase } from './supabaseClient.js';

export class AuthService {
    static STORAGE_KEYS = {
        USER: 'jobnexus_user',
        TOKEN: 'jobnexus_token',
        REFRESH_TOKEN: 'jobnexus_refresh_token',
        TOKEN_EXPIRY: 'jobnexus_token_expiry'
    };

    /**
     * Register new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} name - User full name
     * @returns {Promise<Object>} User object with token
     */
    static async register(email, password, name) {
        try {
            // Validate input
            if (!this.validateEmail(email)) {
                throw new Error('Invalid email format');
            }
            if (password.length < 8) {
                throw new Error('Password must be at least 8 characters');
            }
            if (!name || name.trim().length < 2) {
                throw new Error('Name must be at least 2 characters');
            }

            if (supabase) {
                const { data, error } = await supabase.auth.signUp({
                    email: email.toLowerCase().trim(), password,
                    options: { data: { name: name.trim() }, emailRedirectTo: `${window.location.origin}/` }
                });
                if (error) throw new Error(error.message.includes('already') ? 'Nie można utworzyć konta' : error.message);
                const user = data.user ? { id: data.user.id, email: data.user.email, name: name.trim() } : null;
                if (user && data.session) this.setUser(user, data.session.access_token, data.session.refresh_token, data.session.expires_in);
                return user;
            }

            if (!supabase) {
                throw new Error('Logowanie jest chwilowo niedostępne. Skonfiguruj połączenie Supabase.');
            }

            // Fallback backend API
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    password,
                    name: name.trim()
                }),
                timeout: CONFIG.API_TIMEOUT
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }

            const data = await response.json();
            this.setUser(data.user, data.token, data.refreshToken, data.expiresIn);

            return data.user;
        } catch (error) {
            console.error('Registration error:', error.message);
            throw error;
        }
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} User object with token
     */
    static async login(email, password) {
        try {
            if (!this.validateEmail(email)) {
                throw new Error('Invalid email format');
            }
            if (!password) {
                throw new Error('Password is required');
            }

            if (supabase) {
                const { data, error } = await supabase.auth.signInWithPassword({ email: email.toLowerCase().trim(), password });
                if (error) throw new Error(error.message.includes('Invalid login') ? 'Nieprawidłowy e-mail lub hasło' : error.message);
                const user = data.user ? { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name || data.user.email } : null;
                if (user && data.session) this.setUser(user, data.session.access_token, data.session.refresh_token, data.session.expires_in);
                return user;
            }

            if (!supabase) {
                throw new Error('Logowanie jest chwilowo niedostępne. Skonfiguruj połączenie Supabase.');
            }

            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    password
                }),
                timeout: CONFIG.API_TIMEOUT
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }

            const data = await response.json();
            this.setUser(data.user, data.token, data.refreshToken, data.expiresIn);

            return data.user;
        } catch (error) {
            console.error('Login error:', error.message);
            throw error;
        }
    }

    /**
     * Logout user
     */
    static async logout() {
        try {
            if (supabase) await supabase.auth.signOut();
            localStorage.removeItem(this.STORAGE_KEYS.USER);
            localStorage.removeItem(this.STORAGE_KEYS.TOKEN);
            localStorage.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN);
            localStorage.removeItem(this.STORAGE_KEYS.TOKEN_EXPIRY);
        } catch (error) {
            console.warn('Logout error:', error);
        }
    }

    /**
     * Get current user
     * @returns {Object|null} User object or null
     */
    static getUser() {
        try {
            const user = localStorage.getItem(this.STORAGE_KEYS.USER);
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.warn('Error getting user:', error);
            return null;
        }
    }

    /**
     * Get current token
     * @returns {string|null} JWT token or null
     */
    static getToken() {
        return localStorage.getItem(this.STORAGE_KEYS.TOKEN);
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    static isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        const expiry = localStorage.getItem(this.STORAGE_KEYS.TOKEN_EXPIRY);
        if (!expiry) return false;

        return Date.now() < parseInt(expiry);
    }

    /**
     * Refresh token
     * @returns {Promise<string>} New token
     */
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
            localStorage.setItem(this.STORAGE_KEYS.TOKEN_EXPIRY, data.expiresIn);

            return data.token;
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout();
            throw error;
        }
    }

    /**
     * Update user profile
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated user
     */
    static async updateProfile(updates) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify(updates),
                timeout: CONFIG.API_TIMEOUT
            });

            if (!response.ok) {
                throw new Error('Profile update failed');
            }

            const data = await response.json();
            const user = this.getUser();
            const updatedUser = { ...user, ...data.user };
            localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(updatedUser));

            return updatedUser;
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    }

    /**
     * Set user and token in storage
     * @private
     */
    static setUser(user, token, refreshToken, expiresIn) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
            localStorage.setItem(this.STORAGE_KEYS.TOKEN, token);
            localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
            localStorage.setItem(this.STORAGE_KEYS.TOKEN_EXPIRY, Date.now() + expiresIn);
        } catch (error) {
            console.error('Error setting user:', error);
        }
    }

    /**
     * Validate email format
     * @private
     */
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}

export default AuthService;
