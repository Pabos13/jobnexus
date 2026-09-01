import { jest } from '@jest/globals';
import { AnalyticsService } from '../services/analyticsService.js';
import { AuthService } from '../services/authService.js';
import { CONFIG } from '../config.js';

describe('AnalyticsService', () => {
    beforeEach(() => {
        fetch.mockReset();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('tracks events with session and authenticated user context', () => {
        jest.spyOn(AuthService, 'getUser').mockReturnValue({ id: 'user-1' });
        const sendSpy = jest.spyOn(AnalyticsService, 'sendToAnalytics').mockResolvedValue();

        AnalyticsService.trackEvent('job_view', { jobId: 'job-1' });

        expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
            name: 'job_view',
            sessionId: AnalyticsService.SESSION_ID,
            userId: 'user-1',
            data: { jobId: 'job-1' }
        }));
    });

    it('uses anonymous context when no user is logged in', () => {
        jest.spyOn(AuthService, 'getUser').mockReturnValue(null);
        const sendSpy = jest.spyOn(AnalyticsService, 'sendToAnalytics').mockResolvedValue();

        AnalyticsService.trackEvent('feature_used');

        expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'anonymous',
            data: {}
        }));
    });

    it('maps job, search, filter, and feature helpers to events', () => {
        const trackSpy = jest.spyOn(AnalyticsService, 'trackEvent').mockImplementation(() => {});
        const job = { title: 'Developer', company: 'TechCorp', source: 'csv' };

        AnalyticsService.trackJobView('job-1', job);
        AnalyticsService.trackJobApply('job-1', job);
        AnalyticsService.trackSearch('developer', 'Warszawa', 12);
        AnalyticsService.trackFilterUsed('workMode', 'remote');
        AnalyticsService.trackFeatureUsed('favorites');

        expect(trackSpy).toHaveBeenNthCalledWith(1, 'job_view', {
            jobId: 'job-1',
            title: 'Developer',
            company: 'TechCorp',
            source: 'csv'
        });
        expect(trackSpy).toHaveBeenNthCalledWith(2, 'job_apply', {
            jobId: 'job-1',
            title: 'Developer',
            company: 'TechCorp'
        });
        expect(trackSpy).toHaveBeenNthCalledWith(3, 'search', expect.objectContaining({
            query: 'developer',
            location: 'Warszawa',
            resultsCount: 12
        }));
        expect(trackSpy).toHaveBeenNthCalledWith(4, 'filter_used', {
            filterType: 'workMode',
            filterValue: 'remote'
        });
        expect(trackSpy).toHaveBeenNthCalledWith(5, 'feature_used', {
            feature: 'favorites'
        });
    });

    it('includes browser context in page view and error events', () => {
        document.title = 'JobNexus';
        const trackSpy = jest.spyOn(AnalyticsService, 'trackEvent').mockImplementation(() => {});

        AnalyticsService.trackPageView('home', '/jobs');
        AnalyticsService.trackError('NetworkError', 'Request failed');

        expect(trackSpy).toHaveBeenNthCalledWith(1, 'page_view', expect.objectContaining({
            page: 'home',
            url: '/jobs',
            title: 'JobNexus'
        }));
        expect(trackSpy).toHaveBeenNthCalledWith(2, 'error', expect.objectContaining({
            error: 'NetworkError',
            message: 'Request failed',
            url: window.location.href,
            userAgent: navigator.userAgent
        }));
    });

    it('posts events to the configured analytics endpoint', async () => {
        fetch.mockResolvedValue({ ok: true });
        const event = { name: 'search', data: { query: 'developer' } };

        await AnalyticsService.sendToAnalytics(event);

        expect(fetch).toHaveBeenCalledWith(`${CONFIG.API_BASE_URL}/analytics/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
            timeout: 5000
        });
    });

    it('generates session IDs from the current time and random value', () => {
        jest.spyOn(Date, 'now').mockReturnValue(1234);
        jest.spyOn(Math, 'random').mockReturnValue(0.5);

        expect(AnalyticsService.generateSessionId()).toBe('session-1234-i');
    });
});
