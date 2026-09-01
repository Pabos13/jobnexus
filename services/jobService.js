/**
 * JobService — Centralna usługa pobierania, łączenia, filtrowania i cache'owania ofert pracy
 * Obsługuje Jooble API, pliki CSV oraz bezpieczny fallback danych
 */

const DEMO_FALLBACK_JOBS = [
    {
        id: 'jb-1',
        title: 'Senior Full Stack Developer (React & Node.js)',
        company: 'NexusTech Solutions',
        location: 'Warszawa / Zdalnie',
        salary: '18 000 - 24 000 PLN',
        type: 'Zdalna',
        category: 'it',
        description: 'Rozwój platformy chmurowej SaaS w architekturze mikroserwisów. Wymagane: React 18, TypeScript, Node.js, PostgreSQL, AWS.',
        date: new Date().toISOString(),
        featured: true,
        url: '#'
    },
    {
        id: 'jb-2',
        title: 'AI Prompt Engineer & LLM Specialist',
        company: 'Cognitive AI Labs',
        location: 'Kraków / Zdalnie',
        salary: '16 000 - 22 000 PLN',
        type: 'Zdalna',
        category: 'ai',
        description: 'Budowa i optymalizacja pipeline promptów dla modeli Claude i OpenAI, ewaluacja modeli LLM oraz integracja z systemami RAG.',
        date: new Date().toISOString(),
        featured: true,
        url: '#'
    },
    {
        id: 'jb-3',
        title: 'Spawacz TIG / MIG-MAG (Konstrukcje stalowe)',
        company: 'StalBud Engineering',
        location: 'Gdańsk / Trójmiasto',
        salary: '7 500 - 11 000 PLN',
        type: 'Pełny etat',
        category: 'inzynieria',
        description: 'Prace spawalnicze metodami 141 (TIG) oraz 135 (MAG). Wymagane aktualne uprawnienia spawalnicze oraz czytanie rysunku technicznego.',
        date: new Date().toISOString(),
        featured: false,
        url: '#'
    },
    {
        id: 'jb-4',
        title: 'UI/UX Product Designer (Design System & Figma)',
        company: 'PixelCraft Studio',
        location: 'Wrocław / Zdalnie',
        salary: '12 000 - 16 000 PLN',
        type: 'Zdalna',
        category: 'design',
        description: 'Projektowanie zaawansowanych interfejsów B2B/SaaS, tworzenie komponentów w Figmie oraz prowadzenie testów użyteczności.',
        date: new Date().toISOString(),
        featured: true,
        url: '#'
    },
    {
        id: 'jb-5',
        title: 'Główna Księgowa / Senior Accountant',
        company: 'FinancePro Partners',
        location: 'Poznań',
        salary: '10 000 - 14 000 PLN',
        type: 'Pełny etat',
        category: 'finanse',
        description: 'Prowadzenie pełnej księgowości spółek handlowych, sporządzanie deklaracji podatkowych CIT, VAT, JPK oraz sprawozdań finansowych.',
        date: new Date().toISOString(),
        featured: false,
        url: '#'
    },
    {
        id: 'jb-6',
        title: 'DevOps Cloud Engineer (AWS / Kubernetes / CI/CD)',
        company: 'CloudScale Infrastructure',
        location: 'Warszawa / Zdalnie',
        salary: '20 000 - 27 000 PLN',
        type: 'Zdalna',
        category: 'it',
        description: 'Zarządzanie klastrami Kubernetes w AWS (EKS), pisanie kodu infrastruktury w Terraformie, automatyzacja pipeline CI/CD.',
        date: new Date().toISOString(),
        featured: true,
        url: '#'
    },
    {
        id: 'jb-7',
        title: 'Kierowca C+E (Trasy Międzynarodowe)',
        company: 'TransLogistics Global',
        location: 'Katowice / Europa',
        salary: '9 000 - 13 500 PLN',
        type: 'Pełny etat',
        category: 'logistyka',
        description: 'Przewozy międzynarodowe na terenie UE w systemie 2/1 lub 3/1. Nowoczesny tabor ciągników Euro 6.',
        date: new Date().toISOString(),
        featured: false,
        url: '#'
    },
    {
        id: 'jb-8',
        title: 'Elektryk Automatyk Przemysłowy (SEP do 1kV)',
        company: 'AutoRobotics Polska',
        location: 'Łódź',
        salary: '8 000 - 11 500 PLN',
        type: 'Pełny etat',
        category: 'inzynieria',
        description: 'Utrzymanie ruchu zautomatyzowanych linii produkcyjnych, diagnostyka sterowników PLC (Siemens S7, TIA Portal), szafy sterownicze.',
        date: new Date().toISOString(),
        featured: false,
        url: '#'
    },
    {
        id: 'jb-9',
        title: 'Growth Marketing & Performance Specialist',
        company: 'ScaleUp Ventures',
        location: 'Warszawa / Zdalnie',
        salary: '9 000 - 14 000 PLN',
        type: 'Zdalna',
        category: 'marketing',
        description: 'Skalowanie kampanii Paid Ads (Meta, Google, LinkedIn), analityka GA4, optymalizacja współczynnika konwersji (CRO).',
        date: new Date().toISOString(),
        featured: true,
        url: '#'
    },
    {
        id: 'jb-10',
        title: 'Frontend Developer (Vue 3, Pinia & Tailwind)',
        company: 'Veloce Software House',
        location: 'Zdalnie',
        salary: '14 000 - 18 000 PLN',
        type: 'Zdalna',
        category: 'it',
        description: 'Implementacja interfejsów w Vue.js 3 (Composition API), praca z TailwindCSS i integracja z GraphQL API.',
        date: new Date().toISOString(),
        featured: false,
        url: '#'
    },
    {
        id: 'jb-11',
        title: 'Junior QA Automation Engineer (Playwright / TS)',
        company: 'QualityFirst Labs',
        location: 'Kraków / Hybrydowo',
        salary: '7 000 - 9 500 PLN',
        type: 'Staż',
        category: 'it',
        description: 'Tworzenie i utrzymanie testów automatycznych end-to-end w Playwright (TypeScript), raportowanie błędów w Jira.',
        date: new Date().toISOString(),
        featured: false,
        url: '#'
    },
    {
        id: 'jb-12',
        title: 'Cybersecurity Analyst & Threat Hunter (SOC)',
        company: 'SecureNet Defense',
        location: 'Warszawa / Zdalnie',
        salary: '16 000 - 23 000 PLN',
        type: 'Kontrakt',
        category: 'it',
        description: 'Monitorowanie i analiza incydentów w systemach SIEM/EDR, reagowanie na zagrożenia, testy podatności infrastruktury.',
        date: new Date().toISOString(),
        featured: true,
        url: '#'
    }
];

const JobService = {
    DEMO_JOBS: DEMO_FALLBACK_JOBS,

    async loadCSVJobs() {
        const candidatePaths = ['offers.csv', '/offers.csv', 'public/offers.csv'];
        for (const path of candidatePaths) {
            try {
                const response = await fetch(path, { cache: 'no-cache' });
                if (response.ok) {
                    const text = await response.text();
                    if (text && !text.trim().startsWith('<!DOCTYPE') && !text.trim().startsWith('<html')) {
                        const parsed = this.parseCSV(text);
                        if (parsed && parsed.length > 0) return parsed;
                    }
                }
            } catch (e) {
                // continue
            }
        }
        return this.DEMO_JOBS;
    },

    parseCSV(text) {
        if (!text || typeof text !== 'string') return [];
        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
        const jobs = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = [];
            let inQuotes = false;
            let current = '';

            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"' || char === "'") {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim().replace(/^["']|["']$/g, ''));
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim().replace(/^["']|["']$/g, ''));

            const job = {};
            headers.forEach((header, index) => {
                job[header] = values[index] || '';
            });

            if (job.title || job.stanowisko) {
                jobs.push({
                    id: job.id || `csv-${i}`,
                    title: job.title || job.stanowisko || 'Oferta pracy',
                    company: job.company || job.firma || 'Firma',
                    location: job.location || job.lokalizacja || 'Polska',
                    salary: job.salary || job.wynagrodzenie || 'Konkurencyjne',
                    type: job.type || job.typ || 'Pełny etat',
                    category: (job.category || job.kategoria || 'it').toLowerCase(),
                    description: job.description || job.opis || '',
                    date: job.date || job.data || new Date().toISOString(),
                    featured: String(job.featured || job.wyroznione).toLowerCase() === 'true',
                    url: job.url || '#'
                });
            }
        }

        return jobs.length ? jobs : this.DEMO_JOBS;
    },

    async loadJoobleJobs(keywords = 'praca', location = 'Polska') {
        const apiKey = (typeof CONFIG !== 'undefined' && CONFIG.JOOBLE_API_KEY) ? CONFIG.JOOBLE_API_KEY : '0c6396f9-05ea-4027-bc0c-d38a08d27771';
        const targetUrl = `https://pl.jooble.org/api/${apiKey}`;
        const requestBody = JSON.stringify({
            keywords: keywords || 'praca',
            location: location || 'Polska',
            page: 1,
            result_on_page: 20
        });

        const proxies = [
            `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
            targetUrl
        ];

        for (const url of proxies) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: requestBody
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data && Array.isArray(data.jobs) && data.jobs.length > 0) {
                        return data.jobs.map((item, index) => ({
                            id: `jooble-${item.id || index}`,
                            title: item.title || 'Oferta pracy',
                            company: item.company || 'Pracodawca zweryfikowany',
                            location: item.location || location || 'Polska',
                            salary: item.salary || 'Konkurencyjne',
                            type: item.type || (item.title?.toLowerCase().includes('zdaln') ? 'Zdalna' : 'Pełny etat'),
                            category: this.detectCategory(item.title || ''),
                            description: (item.snippet || '').replace(/<[^>]*>?/gm, ''),
                            date: item.updated || new Date().toISOString(),
                            featured: false,
                            url: item.link || '#'
                        }));
                    }
                }
            } catch (err) {
                // try next
            }
        }

        return this.filterJobs(this.DEMO_JOBS, { searchQuery: keywords, locationQuery: location });
    },

    detectCategory(title = '') {
        const t = title.toLowerCase();
        if (t.includes('ai') || t.includes('data') || t.includes('llm') || t.includes('machine')) return 'ai';
        if (t.includes('developer') || t.includes('programista') || t.includes('react') || t.includes('it') || t.includes('full') || t.includes('front') || t.includes('back')) return 'it';
        if (t.includes('spawacz') || t.includes('inzynier') || t.includes('elektryk') || t.includes('mechanik') || t.includes('automatyk')) return 'inzynieria';
        if (t.includes('ksiegow') || t.includes('finans') || t.includes('accountant') || t.includes('audyt')) return 'finanse';
        if (t.includes('marketing') || t.includes('seo') || t.includes('copywriter') || t.includes('social')) return 'marketing';
        if (t.includes('design') || t.includes('ui') || t.includes('ux') || t.includes('grafik')) return 'design';
        return 'it';
    },

    combineJobs(csvJobs = [], apiJobs = []) {
        const combined = [...csvJobs, ...apiJobs];
        if (combined.length === 0) return [...this.DEMO_JOBS];

        const seen = new Set();
        return combined.filter(job => {
            const key = `${(job.title || '').toLowerCase()}|${(job.company || '').toLowerCase()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    },

    filterJobs(jobs = [], { searchQuery = '', locationQuery = '', currentFilter = 'all', minSalary = 0 } = {}) {
        let list = (jobs && jobs.length) ? jobs : this.DEMO_JOBS;

        const sQuery = (searchQuery || '').toLowerCase().trim();
        const lQuery = (locationQuery || '').toLowerCase().trim();
        const filter = (currentFilter || 'all').toLowerCase();

        return list.filter(job => {
            if (sQuery) {
                const title = (job.title || '').toLowerCase();
                const comp = (job.company || '').toLowerCase();
                const desc = (job.description || '').toLowerCase();
                if (!title.includes(sQuery) && !comp.includes(sQuery) && !desc.includes(sQuery)) {
                    return false;
                }
            }

            if (lQuery) {
                const loc = (job.location || '').toLowerCase();
                if (!loc.includes(lQuery)) {
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
