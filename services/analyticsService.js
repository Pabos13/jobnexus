/**
 * Analytics Service
 * Tracks events, page views, searches, and user actions
 */
import { AuthService } from './authService.js';
import { CONFIG } from '../config.js';

export class AnalyticsService {
    static SESSION_ID = this.generateSessionId();

    static generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    static async trackEvent(name, data = {}) {
        const user = AuthService.getUser();
        const event = {
            name,
            sessionId: this.SESSION_ID,
            userId: user?.id || 'anonymous',
            data,
            timestamp: new Date().toISOString()
        };

        return this.sendToAnalytics(event);
    }

    static async sendToAnalytics(event) {
        try {
            const url = `${CONFIG.API_BASE_URL}/analytics/track`;
            return await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event),
                timeout: 5000
            });
        } catch (error) {
            console.warn('Analytics tracking error:', error);
        }
    }

    static trackJobView(jobId, job = {}) {
        return this.trackEvent('job_view', {
            jobId,
            title: job.title,
            company: job.company,
            source: job.source
        });
    }

    static trackJobApply(jobId, job = {}) {
        return this.trackEvent('job_apply', {
            jobId,
            title: job.title,
            company: job.company
        });
    }

    static trackSearch(query, location, resultsCount) {
        return this.trackEvent('search', {
            query,
            location,
            resultsCount
        });
    }

    static trackFilterUsed(filterType, filterValue) {
        return this.trackEvent('filter_used', {
            filterType,
            filterValue
        });
    }

    static trackFeatureUsed(feature) {
        return this.trackEvent('feature_used', {
            feature
        });
    }

    static trackPageView(page, url) {
        return this.trackEvent('page_view', {
            page,
            url,
            title: typeof document !== 'undefined' ? document.title : ''
        });
    }

    static trackError(error, message) {
        return this.trackEvent('error', {
            error,
            message,
            url: typeof window !== 'undefined' ? window.location.href : '',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
        });
    }
}

if (typeof window !== 'undefined') {
    window.AnalyticsService = AnalyticsService;
}

export default AnalyticsService;
