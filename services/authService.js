/**
 * Authentication Service
 * Handles user login, registration, roles, and session persistence
 * Provides seamless client-side authentication with LocalStorage and Supabase fallback.
 */

export class AuthService {
    static STORAGE_KEYS = {
        USER: 'jobnexus_user',
        TOKEN: 'jobnexus_token',
        LOCAL_USERS: 'jobnexus_local_registered_users'
    };

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

    static _saveLocalUsers(users) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.LOCAL_USERS, JSON.stringify(users));
        } catch (e) {
            console.warn('Could not save local users:', e);
        }
    }

    static validateEmail(email) {
        if (!email || typeof email !== 'string') return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    }

    /**
     * Register a new user (Candidate or Recruiter)
     */
    static async register(email, password, name = '', role = 'candidate') {
        if (!email || !this.validateEmail(email)) {
            throw new Error('Wprowadź poprawny adres e-mail.');
        }
        if (!password || password.length < 6) {
            throw new Error('Hasło musi mieć co najmniej 6 znaków.');
        }

        const cleanEmail = email.toLowerCase().trim();
        const cleanName = (name && name.trim().length >= 2) ? name.trim() : cleanEmail.split('@')[0];
        const userRole = (role === 'recruiter') ? 'recruiter' : 'candidate';

        const users = this._getLocalUsers();
        const existing = users.find(u => u.email === cleanEmail);
        if (existing) {
            // Update role/password if existing
            existing.name = cleanName;
            existing.role = userRole;
            existing.password = password;
            this._saveLocalUsers(users);
            this.setUser(existing);
            return existing;
        }

        const newUser = {
            id: `usr_${Date.now()}`,
            email: cleanEmail,
            name: cleanName,
            role: userRole,
            password: password,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this._saveLocalUsers(users);
        this.setUser(newUser);
        return newUser;
    }

    /**
     * Login user
     */
    static async login(email, password) {
        if (!email || !this.validateEmail(email)) {
            throw new Error('Wprowadź poprawny adres e-mail.');
        }
        if (!password) {
            throw new Error('Wprowadź hasło.');
        }

        const cleanEmail = email.toLowerCase().trim();
        const users = this._getLocalUsers();
        let user = users.find(u => u.email === cleanEmail);

        if (user) {
            if (user.password && user.password !== password) {
                throw new Error('Nieprawidłowe hasło. Spróbuj ponownie.');
            }
        } else {
            // Auto-create account if logging in for the first time
            user = {
                id: `usr_${Date.now()}`,
                email: cleanEmail,
                name: cleanEmail.split('@')[0],
                role: 'candidate',
                password: password,
                createdAt: new Date().toISOString()
            };
            users.push(user);
            this._saveLocalUsers(users);
        }

        this.setUser(user);
        return user;
    }

    static setUser(user, token = 'demo_token') {
        try {
            localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
            localStorage.setItem(this.STORAGE_KEYS.TOKEN, token);
            if (typeof window !== 'undefined') {
                window.currentUser = user;
            }
        } catch (e) {
            console.warn('SetUser error:', e);
        }
    }

    static getUser() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEYS.USER);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    static isAuthenticated() {
        return !!this.getUser();
    }

    static async logout() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.USER);
            localStorage.removeItem(this.STORAGE_KEYS.TOKEN);
            if (typeof window !== 'undefined') {
                window.currentUser = null;
            }
        } catch (e) {
            console.warn('Logout error:', e);
        }
    }

    static init() {
        return this.getUser();
    }
}

if (typeof window !== 'undefined') {
    window.AuthService = AuthService;
}

export default AuthService;
