/**
 * JobNexus Configuration
 * Jooble API Key & Platform Configuration
 */

export const CONFIG = {
    API_BASE_URL: (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '',
    JOOBLE_API_KEY: '5be594f9-f5e0-41f5-a41a-9c1ea12566be',
    JOOBLE_API_URL: 'https://pl.jooble.org/api/5be594f9-f5e0-41f5-a41a-9c1ea12566be',
    CSV_PATH: 'offers.csv',
    DEBOUNCE_DELAY: 250,
    DEFAULT_PAGE_SIZE: 9,
    USE_DEMO_DATA: true,
    ENABLE_REALTIME_AI_MATCH: true
};

if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}

export default CONFIG;
