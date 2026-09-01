/**
 * AnalyticsService
 */
const AnalyticsService = {
    track(event, data = {}) {},
    trackSearch(query) {},
    trackJobView(jobId) {},
    trackApplication(jobId) {}
};

export { AnalyticsService };
export default AnalyticsService;
