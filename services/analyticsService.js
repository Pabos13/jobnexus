/**
 * Analytics Service
 * Tracks user behavior and events
 */

import { AuthService } from './authService.js';
import { CONFIG } from '../config.js';

export class AnalyticsService {
    static STORAGE_KEY = 'jobnexus_analytics';
    static SESSION_ID = this.generateSessionId();

    /**
     * Track custom event
     * @param {string} eventName - Event name
     * @param {Object} data - Event data
     */
    static trackEvent(eventName, data = {}) {
        try {
            const event = {
                name: eventName,
                timestamp: new Date().toISOString(),
                sessionId: this.SESSION_ID,
                userId: AuthService.getUser()?.id || 'anonymous',
                data
            };

            // Log locally
            console.log(`📊 Event: ${eventName}`, data);

            // Send to analytics server (non-blocking)
            this.sendToAnalytics(event).catch(() => {});
        } catch (error) {
            console.warn('Analytics error:', error);
        }
    }

    /**
     * Track page view
     * @param {string} pageName - Page name
     * @param {string} url - Page URL
     */
    static trackPageView(pageName, url = window.location.pathname) {
        this.trackEvent('page_view', {
            page: pageName,
            url,
            referrer: document.referrer,
            title: document.title
        });
    }

    /**
     * Track job click/view
     * @param {string} jobId - Job ID
     * @param {Object} job - Job object
     */
    static trackJobView(jobId, job) {
        this.trackEvent('job_view', {
            jobId,
            title: job?.title,
            company: job?.company,
            source: job?.source
        });
    }

    /**
     * Track job apply/click
     * @param {string} jobId - Job ID
     * @param {Object} job - Job object
     */
    static trackJobApply(jobId, job) {
        this.trackEvent('job_apply', {
            jobId,
            title: job?.title,
            company: job?.company
        });
    }

    /**
     * Track search query
     * @param {string} query - Search query
     * @param {string} location - Location filter
     * @param {number} resultsCount - Number of results
     */
    static trackSearch(query, location, resultsCount) {
        this.trackEvent('search', {
            query,
            location,
            resultsCount,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Track filter usage
     * @param {string} filterType - Filter type
     * @param {string} filterValue - Filter value
     */
    static trackFilterUsed(filterType, filterValue) {
        this.trackEvent('filter_used', {
            filterType,
            filterValue
        });
    }

    /**
     * Track feature usage
     * @param {string} featureName - Feature name
     */
    static trackFeatureUsed(featureName) {
        this.trackEvent('feature_used', {
            feature: featureName
        });
    }

    /**
     * Track error
     * @param {string} errorName - Error name
     * @param {string} errorMessage - Error message
     */
    static trackError(errorName, errorMessage) {
        this.trackEvent('error', {
            error: errorName,
            message: errorMessage,
            url: window.location.href,
            userAgent: navigator.userAgent
        });
    }

    /**
     * Send event to analytics server
     * @private
     */
    static async sendToAnalytics(event) {
        try {
            // Only send if analytics endpoint is configured
            if (!CONFIG.API_BASE_URL) return;

            await fetch(`${CONFIG.API_BASE_URL}/analytics/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event),
                timeout: 5000
            });
        } catch (error) {
            // Silently fail - don't interrupt user experience
        }
    }

    /**
     * Generate unique session ID
     * @private
     */
    static generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

export default AnalyticsService;
