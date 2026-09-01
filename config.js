/**
 * JobNexus Configuration
 * Jooble API Key & Platform Configuration
 */

const CONFIG = {
    // Jooble API Configuration
    JOOBLE_API_KEY: '5be594f9-f5e0-41f5-a41a-9c1ea12566be',
    JOOBLE_API_URL: 'https://pl.jooble.org/api/5be594f9-f5e0-41f5-a41a-9c1ea12566be',

    // CSV Paths
    CSV_PATH: 'offers.csv',

    // UI Settings
    DEBOUNCE_DELAY: 250,
    DEFAULT_PAGE_SIZE: 9,

    // Fallback Settings
    USE_DEMO_DATA: true,
    ENABLE_REALTIME_AI_MATCH: true
};

if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}

export default CONFIG;
