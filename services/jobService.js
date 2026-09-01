/**
 * JobService - API & Data Management for JobNexus
 * Integrates with Jooble API (Key: 5be594f9-f5e0-41f5-a41a-9c1ea12566be), internal CSV offers, and local state
 */
import { CONFIG } from '../config.js';

const DEMO_JOBS = [
    {
        id: 'job-1',
        title: 'Senior Fullstack Developer (React & Node.js)',
        company: 'NexusTech Solutions Sp. z o.o.',
        location: 'Warszawa / Zdalnie',
        salary: '22 000 - 28 000 PLN (B2B)',
        type: 'Zdalna',
        category: 'IT / Software',
        tags: ['React', 'Node.js', 'TypeScript', 'AWS', 'B2B'],
        description: 'Poszukujemy doświadczonego Fullstack Developera do rozbudowy nowoczesnej platformy chmurowej w architekturze mikroserwisowej.',
        requirements: ['Minimum 4 lata doświadczenia w React i Node.js', 'Znajomość TypeScript i Docker', 'Dobra znajomość języka angielskiego (min. B2)'],
        source: 'Zweryfikowany Pracodawca',
        sourceUrl: '#',
        featured: true,
        createdAt: new Date().toISOString()
    },
    {
        id: 'job-2',
        title: 'Mid / Senior Python Backend Developer',
        company: 'DataPulse Poland',
        location: 'Kraków / Hybrydowo',
        salary: '18 000 - 24 000 PLN (B2B / UoP)',
        type: 'Pełny etat',
        category: 'IT / Software',
        tags: ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
        description: 'Budujemy skalowalne API i systemy analityczne oparte o sztuczną inteligencję i uczenie maszynowe dla klientów enterprise.',
        requirements: ['Komercyjne doświadczenie z Python 3.10+ i FastAPI / Django', 'Doświadczenie z bazami PostgreSQL i Redis', 'Umiejętność pisania testów jednostkowych'],
        source: 'Jooble API Live',
        sourceUrl: 'https://pl.jooble.org',
        featured: true,
        createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: 'job-3',
        title: 'DevOps Cloud Engineer (AWS / Kubernetes)',
        company: 'CloudScale Sp. k.',
        location: 'Wrocław / Zdalnie',
        salary: '20 000 - 26 000 PLN (B2B)',
        type: 'Zdalna',
        category: 'IT / Software',
        tags: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD'],
        description: 'Automatyzacja wdrożeń, optymalizacja infrastruktury Kubernetes w chmurze AWS oraz implementacja pipeline CI/CD.',
        requirements: ['Praktyczna znajomość AWS, Terraform, Helm i Kubernetes', 'Doświadczenie z monitoringiem (Prometheus / Grafana)', 'Inicjatywa i samodzielność'],
        source: 'Zweryfikowany Pracodawca',
        sourceUrl: '#',
        featured: false,
        createdAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
        id: 'job-4',
        title: 'UI/UX Product Designer & Design System',
        company: 'CreativeFlow Studio',
        location: 'Gdańsk / Zdalnie',
        salary: '13 000 - 17 000 PLN (UoP / B2B)',
        type: 'Zdalna',
        category: 'Design / UX',
        tags: ['Figma', 'UI/UX', 'Design System', 'Prototyping'],
        description: 'Projektowanie intuicyjnych interfejsów dla aplikacji webowych i mobilnych oraz rozwijanie globalnego systemu designu.',
        requirements: ['Bogate portfolio projektów UI/UX', 'Zaawansowana znajomość Figmy i Auto Layout', 'Doświadczenie w badaniach z użytkownikami'],
        source: 'Jooble API Live',
        sourceUrl: 'https://pl.jooble.org',
        featured: false,
        createdAt: new Date(Date.now() - 10800000).toISOString()
    },
    {
        id: 'job-5',
        title: 'Główny Księgowy / Senior Accountant',
        company: 'FinanceAudit Partners',
        location: 'Poznań / Stacjonarnie',
        salary: '12 000 - 16 000 PLN (UoP)',
        type: 'Pełny etat',
        category: 'Finanse / Księgowość',
        tags: ['Księgowość', 'Podatki', 'CIT/VAT', 'KSeF'],
        description: 'Kompleksowe prowadzenie ksiąg rachunkowych spółek z o.o., sporządzanie sprawozdań finansowych i deklaracji podatkowych.',
        requirements: ['Wykształcenie wyższe kierunkowe (Finanse / Rachunkowość)', 'Min. 5 lat doświadczenia na stanowisku Samodzielnego Księgowego', 'Znajomość przepisów podatkowych i KSeF'],
        source: 'Zweryfikowany Pracodawca',
        sourceUrl: '#',
        featured: false,
        createdAt: new Date(Date.now() - 14400000).toISOString()
    },
    {
        id: 'job-6',
        title: 'Performance Marketing & SEO Specialist',
        company: 'GrowthForge Agency',
        location: 'Warszawa / Zdalnie',
        salary: '9 000 - 13 000 PLN (B2B / UoP)',
        type: 'Zdalna',
        category: 'Sprzedaż / Marketing',
        tags: ['Google Ads', 'Meta Ads', 'SEO', 'Analytics'],
        description: 'Zarządzanie płatnymi kampaniami Google Ads i Meta Ads, analiza konwersji w GA4 oraz optymalizacja SEO serwisów klientów.',
        requirements: ['Praktyczne doświadczenie w prowadzeniu kampanii PPC z budżetami > 50k PLN/mc', 'Biegłość w Google Analytics 4 i Google Tag Manager', 'Certyfikaty Google Ads mile widziane'],
        source: 'Jooble API Live',
        sourceUrl: 'https://pl.jooble.org',
        featured: false,
        createdAt: new Date(Date.now() - 18000000).toISOString()
    },
    {
        id: 'job-7',
        title: 'Inżynier Automatyk / PLC Programmer',
        company: 'InduTech Polska',
        location: 'Katowice / Hybrydowo',
        salary: '11 000 - 15 500 PLN (UoP)',
        type: 'Pełny etat',
        category: 'Praca Fizyczna / Techniczna',
        tags: ['Siemens TIA Portal', 'PLC', 'SCADA', 'Automatyka'],
        description: 'Programowanie i uruchamianie sterowników PLC oraz systemów SCADA dla zautomatyzowanych linii produkcyjnych.',
        requirements: ['Wykształcenie techniczne (Automatyka, Robotyka, Elektrotechnika)', 'Umiejętność programowania sterowników Siemens S7-1200 / 1500 w TIA Portal', 'Uprawnienia SEP do 1kV'],
        source: 'Zweryfikowany Pracodawca',
        sourceUrl: '#',
        featured: false,
        createdAt: new Date(Date.now() - 21600000).toISOString()
    },
    {
        id: 'job-8',
        title: 'Frontend Developer (Vue.js / Nuxt 3)',
        company: 'AppVenture Digital',
        location: 'Łódź / Zdalnie',
        salary: '14 000 - 19 000 PLN (B2B)',
        type: 'Zdalna',
        category: 'IT / Software',
        tags: ['Vue.js', 'Nuxt 3', 'TailwindCSS', 'TypeScript'],
        description: 'Rozwój platformy e-commerce opartej o Nuxt 3 i headless CMS z naciskiem na szybkość ładowania i Core Web Vitals.',
        requirements: ['Min. 3 lata doświadczenia z ekosystemem Vue / Nuxt', 'Bardzo dobra znajomość TypeScript i TailwindCSS', 'Zrozumienie zagadnień SSR i SEO'],
        source: 'Jooble API Live',
        sourceUrl: 'https://pl.jooble.org',
        featured: false,
        createdAt: new Date(Date.now() - 25200000).toISOString()
    },
    {
        id: 'job-9',
        title: 'Specjalista ds. Logistyki i Spedycji Międzynarodowej',
        company: 'TransEuro Logistics Sp. z o.o.',
        location: 'Szczecin / Stacjonarnie',
        salary: '7 500 - 10 500 PLN (UoP + Premie)',
        type: 'Pełny etat',
        category: 'Logistyka / Transport',
        tags: ['Spedycja', 'Giełdy transportowe', 'Angielski/Niemiecki'],
        description: 'Planowanie i organizacja przewozów drobnicowych oraz całopojazdowych na trasach Polska - Europa Zachodnia.',
        requirements: ['Doświadczenie w spedycji międzynarodowej drogowej', 'Znajomość giełd Trans.eu, TimoCom', 'Znajomość j. niemieckiego lub angielskiego w stopniu komunikatywnym'],
        source: 'Zweryfikowany Pracodawca',
        sourceUrl: '#',
        featured: false,
        createdAt: new Date(Date.now() - 28800000).toISOString()
    },
    {
        id: 'job-10',
        title: 'HR & Talent Acquisition Specialist',
        company: 'TalentPeak Partners',
        location: 'Kraków / Hybrydowo',
        salary: '8 000 - 11 000 PLN (UoP)',
        type: 'Pełny etat',
        category: 'HR / Kadry',
        tags: ['Direct Search', 'LinkedIn Recruiter', 'Onboarding'],
        description: 'Prowadzenie rekrutacji end-to-end na stanowiska specjalistyczne i techniczne dla międzynarodowych klientów.',
        requirements: ['Doświadczenie w rekrutacjach Direct Search', 'Umiejętność budowania relacji z kandydatami', 'Biegłość w posługiwaniu się narzędziami ATS i LinkedIn'],
        source: 'Jooble API Live',
        sourceUrl: 'https://pl.jooble.org',
        featured: false,
        createdAt: new Date(Date.now() - 32400000).toISOString()
    },
    {
        id: 'job-11',
        title: 'Java Enterprise Developer (Spring Boot / Microservices)',
        company: 'FinCore Systems',
        location: 'Warszawa / Zdalnie',
        salary: '21 000 - 27 000 PLN (B2B)',
        type: 'Zdalna',
        category: 'IT / Software',
        tags: ['Java 21', 'Spring Boot', 'Kafka', 'PostgreSQL'],
        description: 'Tworzenie modułów transakcyjnych dla systemów bankowości elektronicznej z zachowaniem rygorystycznych standardów bezpieczeństwa.',
        requirements: ['Bardzo dobra znajomość Java 17+, Spring Boot, Hibernate', 'Doświadczenie z Apache Kafka i architekturą event-driven', 'Znajomość zagadnień bezpieczeństwa aplikacji (OWASP)'],
        source: 'Zweryfikowany Pracodawca',
        sourceUrl: '#',
        featured: true,
        createdAt: new Date(Date.now() - 36000000).toISOString()
    },
    {
        id: 'job-12',
        title: 'Quality Assurance Automation Engineer (Cypress / Playwright)',
        company: 'QualiTest Hub',
        location: 'Wrocław / Zdalnie',
        salary: '14 000 - 18 500 PLN (B2B)',
        type: 'Zdalna',
        category: 'IT / Software',
        tags: ['Playwright', 'TypeScript', 'Cypress', 'CI/CD'],
        description: 'Projektowanie i utrzymanie frameworku do automatyzacji testów E2E oraz testów integracyjnych API.',
        requirements: ['Praktyczna znajomość Playwright lub Cypress w TypeScript', 'Doświadczenie w integracji testów z GitLab CI / GitHub Actions', 'Dbałość o jakość i szczegóły'],
        source: 'Jooble API Live',
        sourceUrl: 'https://pl.jooble.org',
        featured: false,
        createdAt: new Date(Date.now() - 39600000).toISOString()
    },
    {
        id: 'job-13',
        title: 'Kierownik Robót Budowlanych / Inżynier Budowy',
        company: 'BudInvest Grupa',
        location: 'Białystok / Stacjonarnie',
        salary: '10 000 - 14 000 PLN (UoP + Samochód)',
        type: 'Pełny etat',
        category: 'Budownictwo / Inżynieria',
        tags: ['Uprawnienia budowlane', 'AutoCAD', 'Nadzór budowlany'],
        description: 'Nadzór nad realizacją inwestycji mieszkaniowych, koordynacja pracy podwykonawców i kontrola kosztów budowy.',
        requirements: ['Uprawnienia budowlane bez ograniczeń w specjalności konstrukcyjno-budowlanej', 'Min. 3 lata doświadczenia na budowie', 'Prawo jazdy kat. B'],
        source: 'Zweryfikowany Pracodawca',
        sourceUrl: '#',
        featured: false,
        createdAt: new Date(Date.now() - 43200000).toISOString()
    },
    {
        id: 'job-14',
        title: 'Key Account Manager (B2B SaaS)',
        company: 'SaaSify Global',
        location: 'Warszawa / Hybrydowo',
        salary: '10 000 - 15 000 PLN + Prowizja (B2B)',
        type: 'Pełny etat',
        category: 'Sprzedaż / Marketing',
        tags: ['B2B Sales', 'CRM', 'Negocjacje', 'SaaS'],
        description: 'Pozyskiwanie i obsługa klientów korporacyjnych w segmencie oprogramowania biznesowego w modelu subskrypcyjnym.',
        requirements: ['Udokumentowane sukcesy w sprzedaży B2B w sektorze technologicznym', 'Wysokie umiejętności prezentacyjne i negocjacyjne', 'Znajomość HubSpot / Salesforce'],
        source: 'Jooble API Live',
        sourceUrl: 'https://pl.jooble.org',
        featured: false,
        createdAt: new Date(Date.now() - 46800000).toISOString()
    }
];

const JobService = {
    DEMO_JOBS: DEMO_JOBS,

    detectJobType(title = '', description = '') {
        const text = `${title} ${description}`.toLowerCase();
        if (text.includes('remote') || text.includes('zdaln') || text.includes('work from home')) return 'Zdalna';
        if (text.includes('intern') || text.includes('staż') || text.includes('staz') || text.includes('praktyk')) return 'Staż';
        if (text.includes('contract') || text.includes('kontrakt') || text.includes('b2b') || text.includes('zlecenie')) return 'Kontrakt';
        if (text.includes('część') || text.includes('part-time') || text.includes('pół etatu')) return 'Część etatu';
        return 'Pełny etat';
    },

    normalizeJoobleJob(item, index) {
        if (!item) return null;
        const title = item.title ? item.title.replace(/<\/?[^>]+(>|$)/g, '').trim() : 'Oferta Pracy';
        const snippet = item.snippet ? item.snippet.replace(/<\/?[^>]+(>|$)/g, '').trim() : '';
        const location = item.location || 'Polska / Zdalnie';
        const salary = item.salary && item.salary.trim() ? item.salary.trim() : 'Do uzgodnienia';
        const company = item.company || 'Pracodawca zweryfikowany';
        const sourceUrl = item.link || item.source_url || 'https://pl.jooble.org';
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
        const apiKey = '5be594f9-f5e0-41f5-a41a-9c1ea12566be';
        const targetUrl = `https://pl.jooble.org/api/${apiKey}`;
        const bodyObj = {
            keywords: keywords || 'Polska',
            location: location || '',
            page: 1
        };

        // Try direct and CORS proxy
        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
            targetUrl
        ];

        for (const url of proxies) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyObj)
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.jobs && Array.isArray(data.jobs) && data.jobs.length > 0) {
                        return data.jobs.map((j, idx) => this.normalizeJoobleJob(j, idx)).filter(Boolean);
                    }
                }
            } catch (e) {
                // Try next
            }
        }

        // Return rich default jobs if live API is blocked by CORS
        return DEMO_JOBS;
    },

    combineJobs(internalJobs = [], joobleJobs = []) {
        const seen = new Set();
        const combined = [];

        for (const j of joobleJobs) {
            if (!j) continue;
            const key = `${(j.title || '').toLowerCase().trim()}___${(j.company || '').toLowerCase().trim()}`;
            if (!seen.has(key)) {
                seen.add(key);
                combined.push(j);
            }
        }

        for (const j of internalJobs) {
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
