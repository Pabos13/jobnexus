/**
 * Storage Service
 * Handles localStorage for data persistence
 */

export class StorageService {
    static KEYS = {
        ANNOUNCEMENTS: 'jobnexus_announcements',
        CV_MATCHES: 'jobnexus_cv_matches',
        SEARCH_HISTORY: 'jobnexus_search_history',
        USER_PREFERENCES: 'jobnexus_preferences'
    };
    
    /**
     * Save announcements to localStorage
     * @param {Array} announcements - Announcements to save
     */
    static saveAnnouncements(announcements) {
        try {
            localStorage.setItem(this.KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
        } catch (err) {
            console.warn('Failed to save announcements:', err);
        }
    }
    
    /**
     * Load announcements from localStorage
     * @returns {Array} Saved announcements or empty array
     */
    static loadAnnouncements() {
        try {
            const data = localStorage.getItem(this.KEYS.ANNOUNCEMENTS);
            return data ? JSON.parse(data) : [];
        } catch (err) {
            console.warn('Failed to load announcements:', err);
            return [];
        }
    }
    
    /**
     * Save CV matches to localStorage
     * @param {Array} matches - CV matches to save
     */
    static saveCVMatches(matches) {
        try {
            localStorage.setItem(this.KEYS.CV_MATCHES, JSON.stringify({
                matches,
                timestamp: new Date().toISOString()
            }));
        } catch (err) {
            console.warn('Failed to save CV matches:', err);
        }
    }
    
    /**
     * Load CV matches from localStorage
     * @returns {Array} Saved CV matches or empty array
     */
    static loadCVMatches() {
        try {
            const data = localStorage.getItem(this.KEYS.CV_MATCHES);
            if (!data) return [];
            
            const { matches, timestamp } = JSON.parse(data);
            
            // Invalidate matches older than 24 hours
            const age = Date.now() - new Date(timestamp).getTime();
            if (age > 24 * 60 * 60 * 1000) {
                this.clearCVMatches();
                return [];
            }
            
            return matches || [];
        } catch (err) {
            console.warn('Failed to load CV matches:', err);
            return [];
        }
    }
    
    /**
     * Clear CV matches from localStorage
     */
    static clearCVMatches() {
        try {
            localStorage.removeItem(this.KEYS.CV_MATCHES);
        } catch (err) {
            console.warn('Failed to clear CV matches:', err);
        }
    }
    
    /**
     * Add to search history
     * @param {string} query - Search query
     */
    static addSearchHistory(query) {
        try {
            if (!query.trim()) return;
            
            let history = this.getSearchHistory();
            
            // Remove duplicate if exists
            history = history.filter(q => q !== query);
            
            // Add to beginning
            history.unshift(query);
            
            // Keep only last 20 searches
            history = history.slice(0, 20);
            
            localStorage.setItem(this.KEYS.SEARCH_HISTORY, JSON.stringify(history));
        } catch (err) {
            console.warn('Failed to save search history:', err);
        }
    }
    
    /**
     * Get search history
     * @returns {Array} Search history
     */
    static getSearchHistory() {
        try {
            const data = localStorage.getItem(this.KEYS.SEARCH_HISTORY);
            return data ? JSON.parse(data) : [];
        } catch (err) {
            console.warn('Failed to load search history:', err);
            return [];
        }
    }
    
    /**
     * Save user preferences
     * @param {Object} preferences - User preferences
     */
    static savePreferences(preferences) {
        try {
            localStorage.setItem(this.KEYS.USER_PREFERENCES, JSON.stringify(preferences));
        } catch (err) {
            console.warn('Failed to save preferences:', err);
        }
    }
    
    /**
     * Load user preferences
     * @returns {Object} User preferences
     */
    static loadPreferences() {
        try {
            const data = localStorage.getItem(this.KEYS.USER_PREFERENCES);
            return data ? JSON.parse(data) : {};
        } catch (err) {
            console.warn('Failed to load preferences:', err);
            return {};
        }
    }
    
    /**
     * Clear all stored data
     */
    static clearAll() {
        try {
            Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
        } catch (err) {
            console.warn('Failed to clear storage:', err);
        }
    }
}

export default StorageService;
