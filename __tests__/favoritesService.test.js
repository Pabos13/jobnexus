import { jest } from '@jest/globals';
import { FavoritesService } from '../services/favoritesService.js';
import { AuthService } from '../services/authService.js';
import { CONFIG } from '../config.js';

describe('FavoritesService', () => {
    const job = {
        id: 'job-1',
        title: 'Frontend Developer',
        company: 'TechCorp'
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

    it('adds a favorite locally for unauthenticated users', async () => {
        jest.spyOn(AuthService, 'isAuthenticated').mockReturnValue(false);
        const syncSpy = jest.spyOn(FavoritesService, 'syncToBackend');

        const favorite = await FavoritesService.addFavorite(job);

        expect(favorite).toEqual(expect.objectContaining({
            ...job,
            notes: '',
            savedAt: expect.any(String)
        }));
        expect(FavoritesService.getFavorites()).toEqual([favorite]);
        expect(syncSpy).not.toHaveBeenCalled();
    });

    it('rejects duplicate favorites', async () => {
        jest.spyOn(AuthService, 'isAuthenticated').mockReturnValue(false);
        await FavoritesService.addFavorite(job);

        await expect(FavoritesService.addFavorite(job)).rejects.toThrow('Job already in favorites');
    });

    it('syncs additions and removals for authenticated users', async () => {
        jest.spyOn(AuthService, 'isAuthenticated').mockReturnValue(true);
        const syncSpy = jest.spyOn(FavoritesService, 'syncToBackend').mockResolvedValue();

        await FavoritesService.addFavorite(job);
        await FavoritesService.removeFavorite(job.id);

        expect(syncSpy).toHaveBeenNthCalledWith(1, 'add', job.id);
        expect(syncSpy).toHaveBeenNthCalledWith(2, 'remove', job.id);
        expect(FavoritesService.getFavorites()).toEqual([]);
    });

    it('checks favorites and updates their notes', async () => {
        jest.spyOn(AuthService, 'isAuthenticated').mockReturnValue(false);
        await FavoritesService.addFavorite(job);

        FavoritesService.addNote(job.id, 'Strong match');

        expect(FavoritesService.isFavorite(job.id)).toBe(true);
        expect(FavoritesService.getFavorites()[0].notes).toBe('Strong match');
        expect(FavoritesService.isFavorite('missing')).toBe(false);
    });

    it('returns an empty list for invalid stored data', () => {
        localStorage.setItem(FavoritesService.STORAGE_KEY, '{invalid');

        expect(FavoritesService.getFavorites()).toEqual([]);
    });

    it('clears local and backend favorites for authenticated users', async () => {
        localStorage.setItem(FavoritesService.STORAGE_KEY, JSON.stringify([job]));
        jest.spyOn(AuthService, 'isAuthenticated').mockReturnValue(true);
        jest.spyOn(AuthService, 'getToken').mockReturnValue('access-token');
        fetch.mockResolvedValue({ ok: true });

        await FavoritesService.clearAll();

        expect(FavoritesService.getFavorites()).toEqual([]);
        expect(fetch).toHaveBeenCalledWith(`${CONFIG.API_BASE_URL}/favorites/clear`, {
            method: 'POST',
            headers: {
                Authorization: 'Bearer access-token'
            }
        });
    });

    it('posts favorite sync requests with authentication', async () => {
        jest.spyOn(AuthService, 'isAuthenticated').mockReturnValue(true);
        jest.spyOn(AuthService, 'getToken').mockReturnValue('access-token');
        fetch.mockResolvedValue({ ok: true });

        await FavoritesService.syncToBackend('add', job.id);

        expect(fetch).toHaveBeenCalledWith(`${CONFIG.API_BASE_URL}/favorites/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer access-token'
            },
            body: JSON.stringify({ jobId: job.id })
        });
    });
});
