/**
 * Favorites Service
 * Manages user's saved/bookmarked jobs
 */

import { StorageService } from './storageService.js';
import { AuthService } from './authService.js';
import { CONFIG } from '../config.js';

export class FavoritesService {
    static STORAGE_KEY = 'jobnexus_favorites';

    /**
     * Add job to favorites
     * @param {Object} job - Job object
     * @returns {Promise<void>}
     */
    static async addFavorite(job) {
        try {
            const favorites = this.getFavorites();
            
            // Check if already added
            if (favorites.some(fav => fav.id === job.id)) {
                throw new Error('Job already in favorites');
            }

            const favorite = {
                ...job,
                savedAt: new Date().toISOString(),
                notes: ''
            };

            favorites.unshift(favorite);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));

            // Sync to backend if authenticated
            if (AuthService.isAuthenticated()) {
                await this.syncToBackend('add', job.id);
            }

            return favorite;
        } catch (error) {
            console.error('Error adding favorite:', error);
            throw error;
        }
    }

    /**
     * Remove job from favorites
     * @param {string} jobId - Job ID
     * @returns {Promise<void>}
     */
    static async removeFavorite(jobId) {
        try {
            const favorites = this.getFavorites();
            const filtered = favorites.filter(fav => fav.id !== jobId);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));

            // Sync to backend if authenticated
            if (AuthService.isAuthenticated()) {
                await this.syncToBackend('remove', jobId);
            }
        } catch (error) {
            console.error('Error removing favorite:', error);
            throw error;
        }
    }

    /**
     * Get all favorites
     * @returns {Array} Favorites list
     */
    static getFavorites() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.warn('Error getting favorites:', error);
            return [];
        }
    }

    /**
     * Check if job is favorite
     * @param {string} jobId - Job ID
     * @returns {boolean}
     */
    static isFavorite(jobId) {
        return this.getFavorites().some(fav => fav.id === jobId);
    }

    /**
     * Add note to favorite
     * @param {string} jobId - Job ID
     * @param {string} note - Note text
     * @returns {void}
     */
    static addNote(jobId, note) {
        try {
            const favorites = this.getFavorites();
            const favorite = favorites.find(fav => fav.id === jobId);
            
            if (favorite) {
                favorite.notes = note;
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
            }
        } catch (error) {
            console.error('Error adding note:', error);
        }
    }

    /**
     * Clear all favorites
     * @returns {Promise<void>}
     */
    static async clearAll() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            
            if (AuthService.isAuthenticated()) {
                await fetch(`${CONFIG.API_BASE_URL}/favorites/clear`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${AuthService.getToken()}`
                    }
                });
            }
        } catch (error) {
            console.error('Error clearing favorites:', error);
        }
    }

    /**
     * Sync favorites to backend
     * @private
     */
    static async syncToBackend(action, jobId) {
        try {
            if (!AuthService.isAuthenticated()) return;

            await fetch(`${CONFIG.API_BASE_URL}/favorites/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AuthService.getToken()}`
                },
                body: JSON.stringify({ jobId })
            });
        } catch (error) {
            console.warn('Backend sync failed (non-critical):', error);
        }
    }
}

export default FavoritesService;
