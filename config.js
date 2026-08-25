/**
 * JobNexus Configuration
 * Safe configuration without exposing API keys in frontend
 */

export const CONFIG = {
    // Frontend API endpoint (proxies to backend)
    API_BASE_URL: import.meta.env?.VITE_API_BASE_URL || '/api',
    
    // Jooble endpoint (called through backend only)
    JOOBLE_API_URL: import.meta.env?.VITE_JOOBLE_API_URL || 'https://pl.jooble.org/api/',
    
    // CSV path
    CSV_PATH: 'data/offers.csv',
    
    // Pagination
    ITEMS_PER_PAGE: 12,
    
    // Animations
    ANIMATION_DURATION: 800,
    
    // Timeouts
    API_TIMEOUT: 10000,
    DEBOUNCE_DELAY: 400,
    
    // Limits
    MAX_CSV_SIZE: 10 * 1024 * 1024, // 10 MB
    MAX_CV_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
    ACCEPTED_CV_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

export default CONFIG;
