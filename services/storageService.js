/**
 * Storage Service
 * Handles localStorage operations with validation and fallback
 */

export class StorageService {
    static KEYS = {
        JOBS: 'jobnexus_jobs',
        USER: 'jobnexus_user',
        FAVORITES: 'jobnexus_favorites',
        NOTIFICATIONS: 'jobnexus_notifications',
        ANALYTICS: 'jobnexus_analytics',
        APPLICATIONS: 'jobnexus_applications',
        ANNOUNCEMENTS: 'jobnexus_announcements',
        SEARCH_HISTORY: 'jobnexus_search_history',
        CV_MATCHES: 'jobnexus_cv_matches',
        CV_MATCHES_TIME: 'jobnexus_cv_matches_timestamp'
    };

    static getUser() {
        try {
            const raw = localStorage.getItem(this.KEYS.USER);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    static saveUser(user) {
        if (!user) {
            localStorage.removeItem(this.KEYS.USER);
            return;
        }
        try {
            localStorage.setItem(this.KEYS.USER, JSON.stringify(user));
        } catch (e) {
            console.warn('Failed to save user:', e);
        }
    }

    static clearUser() {
        try {
            localStorage.removeItem(this.KEYS.USER);
        } catch (e) {
            console.warn('Failed to clear user:', e);
        }
    }

    static getJobs() {
        try {
            const raw = localStorage.getItem(this.KEYS.JOBS);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    static saveJobs(jobs) {
        try {
            localStorage.setItem(this.KEYS.JOBS, JSON.stringify(jobs));
        } catch (e) {
            console.warn('Failed to save jobs:', e);
        }
    }

    static addJob(job) {
        const jobs = this.getJobs();
        jobs.unshift({
            ...job,
            id: job.id || `custom-${Date.now()}`,
            createdAt: new Date().toISOString()
        });
        this.saveJobs(jobs);
        return jobs;
    }

    static getFavorites() {
        try {
            const raw = localStorage.getItem(this.KEYS.FAVORITES);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    static saveFavorites(favorites) {
        try {
            localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favorites));
        } catch (e) {
            console.warn('Failed to save favorites:', e);
        }
    }

    static toggleFavorite(jobId) {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(jobId);
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(jobId);
        }
        this.saveFavorites(favorites);
        return favorites.includes(jobId);
    }

    static isFavorite(jobId) {
        return this.getFavorites().includes(jobId);
    }

    static getNotifications() {
        try {
            const raw = localStorage.getItem(this.KEYS.NOTIFICATIONS);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    static saveNotifications(notifications) {
        try {
            localStorage.setItem(this.KEYS.NOTIFICATIONS, JSON.stringify(notifications));
        } catch (e) {
            console.warn('Failed to save notifications:', e);
        }
    }

    static addNotification(notification) {
        const notifications = this.getNotifications();
        notifications.unshift({
            ...notification,
            id: `notif-${Date.now()}`,
            read: false,
            createdAt: new Date().toISOString()
        });
        this.saveNotifications(notifications.slice(0, 50));
        return notifications;
    }

    static saveAnnouncements(announcements) {
        try {
            localStorage.setItem(this.KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
        } catch (e) {}
    }

    static loadAnnouncements() {
        try {
            const raw = localStorage.getItem(this.KEYS.ANNOUNCEMENTS);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    static addSearchHistory(query) {
        if (!query || typeof query !== 'string') return;
        try {
            let history = this.getSearchHistory();
            history = history.filter(item => item !== query);
            history.unshift(query);
            if (history.length > 20) history = history.slice(0, 20);
            localStorage.setItem(this.KEYS.SEARCH_HISTORY, JSON.stringify(history));
        } catch (e) {}
    }

    static getSearchHistory() {
        try {
            const raw = localStorage.getItem(this.KEYS.SEARCH_HISTORY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    static saveCVMatches(matches) {
        try {
            localStorage.setItem(this.KEYS.CV_MATCHES, JSON.stringify(matches));
            localStorage.setItem(this.KEYS.CV_MATCHES_TIME, Date.now().toString());
        } catch (e) {}
    }

    static loadCVMatches() {
        try {
            const timeStr = localStorage.getItem(this.KEYS.CV_MATCHES_TIME);
            if (!timeStr) return [];
            const timestamp = parseInt(timeStr, 10);
            if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
                localStorage.removeItem(this.KEYS.CV_MATCHES);
                localStorage.removeItem(this.KEYS.CV_MATCHES_TIME);
                return [];
            }
            const raw = localStorage.getItem(this.KEYS.CV_MATCHES);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    static clearAll() {
        Object.values(this.KEYS).forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (e) {}
        });
    }
}

export default StorageService;
