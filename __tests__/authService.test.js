import { jest } from '@jest/globals';
import { AuthService } from '../services/authService.js';
import { CONFIG } from '../config.js';

describe('AuthService', () => {
    const user = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User'
    };

    beforeEach(() => {
        localStorage.clear();
        fetch.mockReset();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('backend authentication fallback', () => {
        it('registers through the backend when Supabase is not configured', async () => {
            fetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    user,
                    token: 'access-token',
                    refreshToken: 'refresh-token',
                    expiresIn: 60_000
                })
            });

            await expect(
                AuthService.register('USER@example.com', 'password123', '  Test User  ')
            ).resolves.toEqual(user);

            expect(fetch).toHaveBeenCalledWith(`${CONFIG.API_BASE_URL}/auth/register`, expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    email: 'user@example.com',
                    password: 'password123',
                    name: 'Test User'
                })
            }));
            expect(AuthService.getUser()).toEqual(user);
            expect(AuthService.getToken()).toBe('access-token');
        });

        it('logs in through the backend when Supabase is not configured', async () => {
            fetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    user,
                    token: 'access-token',
                    refreshToken: 'refresh-token',
                    expiresIn: 60_000
                })
            });

            await expect(AuthService.login('USER@example.com', 'password123')).resolves.toEqual(user);

            expect(fetch).toHaveBeenCalledWith(`${CONFIG.API_BASE_URL}/auth/login`, expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    email: 'user@example.com',
                    password: 'password123'
                })
            }));
        });

        it('surfaces backend login errors', async () => {
            fetch.mockResolvedValue({
                ok: false,
                json: async () => ({ message: 'Invalid credentials' })
            });

            await expect(AuthService.login('user@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
        });
    });

    describe('validation and session state', () => {
        it.each([
            ['invalid email', 'not-an-email', 'password123', 'Invalid email format'],
            ['missing password', 'user@example.com', '', 'Password is required']
        ])('rejects login with %s', async (_case, email, password, message) => {
            await expect(AuthService.login(email, password)).rejects.toThrow(message);
            expect(fetch).not.toHaveBeenCalled();
        });

        it.each([
            ['invalid email', 'not-an-email', 'password123', 'Test User', 'Invalid email format'],
            ['short password', 'user@example.com', 'short', 'Test User', 'Password must be at least 8 characters'],
            ['short name', 'user@example.com', 'password123', 'T', 'Name must be at least 2 characters']
        ])('rejects registration with %s', async (_case, email, password, name, message) => {
            await expect(AuthService.register(email, password, name)).rejects.toThrow(message);
            expect(fetch).not.toHaveBeenCalled();
        });

        it('reports authentication only for unexpired sessions', () => {
            jest.spyOn(Date, 'now').mockReturnValue(1_000);
            AuthService.setUser(user, 'access-token', 'refresh-token', 500);

            expect(AuthService.isAuthenticated()).toBe(true);

            Date.now.mockReturnValue(1_501);
            expect(AuthService.isAuthenticated()).toBe(false);
        });

        it('logs out and clears all session values', async () => {
            AuthService.setUser(user, 'access-token', 'refresh-token', 60_000);

            await AuthService.logout();

            expect(AuthService.getUser()).toBeNull();
            expect(AuthService.getToken()).toBeNull();
            expect(localStorage.getItem(AuthService.STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
            expect(localStorage.getItem(AuthService.STORAGE_KEYS.TOKEN_EXPIRY)).toBeNull();
        });
    });

    describe('authenticated API calls', () => {
        beforeEach(() => {
            AuthService.setUser(user, 'access-token', 'refresh-token', 60_000);
        });

        it('refreshes and stores an access token', async () => {
            fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ token: 'new-token', expiresIn: '9999999999999' })
            });

            await expect(AuthService.refreshToken()).resolves.toBe('new-token');

            expect(fetch).toHaveBeenCalledWith(`${CONFIG.API_BASE_URL}/auth/refresh`, expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'Bearer refresh-token'
                })
            }));
            expect(AuthService.getToken()).toBe('new-token');
        });

        it('updates the stored user profile', async () => {
            fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ user: { name: 'Updated User' } })
            });

            await expect(AuthService.updateProfile({ name: 'Updated User' })).resolves.toEqual({
                ...user,
                name: 'Updated User'
            });

            expect(fetch).toHaveBeenCalledWith(`${CONFIG.API_BASE_URL}/auth/profile`, expect.objectContaining({
                method: 'PUT',
                headers: expect.objectContaining({
                    Authorization: 'Bearer access-token'
                })
            }));
        });
    });
});
