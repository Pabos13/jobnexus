/**
 * JobService - API & Data Management for JobNexus
 * Integrates with Jooble API, internal CSV offers, and local state
 */
import { CONFIG } from '../config.js';

const JobService = {
    detectJobType(title = '', description = '') {
        const text = `${title} ${description}`.toLowerCase();
        if (text.includes('remote') || text.includes('zdaln') || text.includes('work from home')) {
            return 'Zdalna';
        }
        if (text.includes('intern') || text.includes('staż') || text.includes('staz') || text.includes('praktyk')) {
            return 'Staż';
        }
        if (text.includes('contract') || text.includes('kontrakt') || text.includes('b2b') || text.includes('zlecenie')) {
            return 'Kontrakt';
        }
        if (text.includes('część') || text.includes('part-time') || text.includes('pół etatu')) {
            return 'Część etatu';
        }
        return 'Pełny etat';
    },

    normalizeJoobleJob(item, index) {
        if (!item) return null;
        const title = item.title ? item.title.replace(/<\/?[^>]+(>|$)/g, '').trim() : 'Oferta Pracy';
        const snippet = item.snippet ? item.snippet.replace(/<\/?[^>]+(>|$)/g, '').trim() : '';
        const location = item.location || 'Polska / Zdalnie';
        const salary = item.salary && item.salary.trim() ? item.salary.trim() : 'Do uzgodnienia';
        const company = item.company || 'Pracodawca zweryfikowany';
        const sourceUrl = item.link || item.source_url || '#';
        const type = item.type || this.detectJobType(title, snippet);

        return {
            id: `jooble-${item.id || index || Date.now()}`,
            title: title,
            company: company,
            location: location,
            salary: salary,
            type: type,
            category: this.detectCategory(title, snippet),
            tags: this.extractTags(title, snippet),
            description: snippet || 'Szczegółowy opis stanowiska dostępny u źródła ogłoszenia.',
            requirements: ['Doświadczenie na podobnym stanowisku', 'Motywacja i zaangażowanie'],
            source: 'Jooble Live API',
            sourceUrl: sourceUrl,
            featured: false,
            createdAt: item.updated || new Date().toISOString()
        };
    },

    detectCategory(title, desc) {
        const text = `${title} ${desc}`.toLowerCase();
        if (text.includes('react') || text.includes('javascript') || text.includes('python') || text.includes('developer') || text.includes('programista') || text.includes('frontend') || text.includes('backend') || text.includes('java')) return 'IT / Software';
        if (text.includes('spawacz') || text.includes('monter') || text.includes('mechanik') || text.includes('elektryk') || text.includes('produkcja')) return 'Praca Fizyczna / Techniczna';
        if (text.includes('księg') || text.includes('finans') || text.includes('rachunk') || text.includes('analityk')) return 'Finanse / Księgowość';
        if (text.includes('sprzeda') || text.includes('handlowiec') || text.includes('marketing') || text.includes('obsługa')) return 'Sprzedaż / Marketing';
        return 'Inne';
    },

    extractTags(title, desc) {
        const text = `${title} ${desc}`.toLowerCase();
        const techList = ['React', 'JavaScript', 'TypeScript', 'Python', 'Java', 'Node.js', 'SQL', 'AWS', 'Docker', 'TIG', 'MIG/MAG', 'Excel', 'B2B', 'Zdalnie', 'Full-time'];
        const found = [];
        for (const t of techList) {
            if (text.includes(t.toLowerCase())) found.push(t);
        }
        if (found.length === 0) found.push('Standard');
        return found.slice(0, 4);
    },

    async loadJoobleJobs(keywords = '', location = '') {
        const apiKey = CONFIG.JOOBLE_API_KEY || '5be594f9-f5e0-41f5-a41a-9c1ea12566be';
        const url = CONFIG.JOOBLE_API_URL || `https://pl.jooble.org/api/${apiKey}`;

        try {
            const body = {
                keywords: keywords || 'praca',
                location: location || '',
                radius: 25,
                page: 1
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                console.warn(`Jooble API status: ${response.status}`);
                return [];
            }

            const data = await response.json();
            const rawJobs = data.jobs || [];
            return rawJobs.map((item, idx) => this.normalizeJoobleJob(item, idx));
        } catch (error) {
            console.warn('Jooble fetch error:', error);
            return [];
        }
    },

    combineJobs(internalJobs = [], joobleJobs = []) {
        const seen = new Set();
        const combined = [];

        for (const j of internalJobs) {
            if (!j) continue;
            const key = `${(j.title || '').toLowerCase().trim()}___${(j.company || '').toLowerCase().trim()}`;
            if (!seen.has(key)) {
                seen.add(key);
                combined.push(j);
            }
        }

        for (const j of joobleJobs) {
            if (!j) continue;
            const key = `${(j.title || '').toLowerCase().trim()}___${(j.company || '').toLowerCase().trim()}`;
            if (!seen.has(key)) {
                seen.add(key);
                combined.push(j);
            }
        }

        return combined;
    },

    filterJobs(jobs = [], filters = {}) {
        const query = (filters.searchQuery || '').toLowerCase().trim();
        const locQuery = (filters.locationQuery || '').toLowerCase().trim();
        const filter = (filters.currentFilter || 'all').toLowerCase();
        const minSalary = filters.minSalary || 0;

        return jobs.filter(job => {
            if (!job) return false;

            const title = (job.title || '').toLowerCase();
            const desc = (job.description || '').toLowerCase();
            const comp = (job.company || '').toLowerCase();
            const loc = (job.location || '').toLowerCase();
            const tags = (job.tags || []).map(t => t.toLowerCase()).join(' ');

            if (query) {
                const qWords = query.split(/\s+/);
                const fullText = `${title} ${desc} ${comp} ${tags}`;
                const matches = qWords.every(w => fullText.includes(w));
                if (!matches) return false;
            }

            if (locQuery) {
                if (!loc.includes(locQuery) && !locQuery.includes(loc)) {
                    return false;
                }
            }

            if (minSalary > 0) {
                const salText = job.salary || '';
                const nums = salText.replace(/\s/g, '').match(/\d+/g);
                if (nums && nums.length > 0) {
                    const maxVal = Math.max(...nums.map(n => parseInt(n, 10)));
                    if (maxVal < minSalary) return false;
                }
            }

            if (filter !== 'all') {
                const type = (job.type || '').toLowerCase();
                const cat = (job.category || '').toLowerCase();
                const title = (job.title || '').toLowerCase();

                if (filter === 'remote' || filter === 'zdalna') {
                    if (!type.includes('zdaln') && !loc.includes('zdaln')) return false;
                } else if (filter === 'intern' || filter === 'staz' || filter === 'staż') {
                    if (!type.includes('staż') && !type.includes('staz') && !type.includes('intern')) return false;
                } else if (filter === 'b2b' || filter === 'kontrakt') {
                    if (!type.includes('b2b') && !type.includes('kontrakt')) return false;
                } else if (!cat.includes(filter) && !title.includes(filter)) {
                    return false;
                }
            }

            return true;
        });
    }
};

if (typeof window !== 'undefined') {
    window.JobService = JobService;
}

export { JobService };
export default JobService;
