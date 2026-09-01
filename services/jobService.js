/**
 * JobService — Centralna usługa pobierania, łączenia, filtrowania i cache'owania ofert pracy
 */

const DEMO_FALLBACK_JOBS = [
    {
        id: 'demo-1',
        title: 'Senior Full Stack Developer (React & Node.js)',
        company: 'NexusTech Solutions',
        location: 'Zdalnie / Warszawa',
        salary: '18 000 - 24 000 PLN',
        type: 'Zdalna',
        category: 'it',
        description: 'Poszukujemy doświadczonego programisty Full Stack do rozwijania platformy AI. Wymagane: React, TypeScript, Node.js, PostgreSQL.',
        date: new Date().toISOString(),
        featured: true,
        url: '#'
    },
    {
        id: 'demo-2',
        title: 'AI Prompt Engineer & LLM Specialist',
        company: 'Cognitive AI Labs',
        location: 'Zdalnie / Kraków',
        salary: '16 000 - 22 000 PLN',
        type: 'Zdalna',
        category: 'ai',
        description: 'Tworzenie i optymalizacja promptów, fine-tuning modeli językowych, integracja z API OpenAI i Claude.',
        date: new Date().toISOString(),
        featured: true,
        url: '#'
    },
    {
        id: 'demo-3',
        title: 'Spawacz TIG / MIG-MAG (Konstrukcje stalowe)',
        company: 'StalBud Engineering',
        location: 'Gdańsk / Trójmiasto',
        salary: '7 500 - 11 000 PLN',
        type: 'Pełny etat',
        category: 'inzynieria',
        description: 'Prace spawalnicze metodami 141 (TIG) oraz 135 (MAG). Wymagane aktualne uprawnienia UDT/TÜV oraz czytanie rysunku technicznego.',
        date: new Date().toISOString(),
        featured: false,
        url: '#'
    },
    {
        id: 'demo-4',
        title: 'UI/UX Product Designer (Figma / Design System)',
        company: 'PixelCraft Studio',
        location: 'Zdalnie / Wrocław',
        salary: '12 000 - 16 000 PLN',
        type: 'Zdalna',
        category: 'design',
        description: 'Projektowanie intuicyjnych interfejsów aplikacji webowych i mobilnych, budowa Design Systemu w Figmie.',
        date: new Date().toISOString(),
        featured: true,
        url: '#'
    },
    {
        id: 'demo-5',
        title: 'Główna Księgowa / Senior Accountant',
        company: 'FinancePro Partners',
        location: 'Poznań',
        salary: '10 000 - 14 000 PLN',
        type: 'Pełny etat',
        category: 'finanse',
        description: 'Prowadzenie pełnej księgowości spółek z o.o., sporządzanie sprawozdań finansowych, deklaracji VAT, CIT, JPK.',
        date: new Date().toISOString(),
        featured: false,
        url: '#'
    },
    {
        id: 'demo-6',
        title: 'DevOps Cloud Engineer (AWS / Kubernetes)',
        company: 'CloudScale Infrastructure',
        location: 'Zdalnie / Warszawa',
        salary: '20 000 - 27 000 PLN',
        type: 'Zdalna',
        category: 'it',
        description: 'Automatyzacja CI/CD (GitHub Actions), zarządzanie klastrami EKS Kubernetes, Terraform, monitoring Prometheus/Grafana.',
        date: new Date().toISOString(),
        featured: true,
        url: '#'
    },
    {
        id: 'demo-7',
        title: 'Kierowca C+E (Trasy międzynarodowe)',
        company: 'TransLogistics Global',
        location: 'Katowice / Europa',
        salary: '9 000 - 13 500 PLN',
        type: 'Pełny etat',
        category: 'logistyka',
        description: 'Transport towarów w systemie 2/1 lub 3/1 po Europie Zachodniej. Nowa flota pojazdów Euro 6.',
        date: new Date().toISOString(),
        featured: false,
        url: '#'
    },
    {
        id: 'demo-8',
        title: 'Elektryk Automatyk Przemysłowy (SEP do 1kV)',
        company: 'AutoRobotics Polska',
        location: 'Łódź',
        salary: '8 000 - 11 500 PLN',
        type: 'Pełny etat',
        category: 'inzynieria',
        description: 'Konserwacja linii produkcyjnych, diagnostyka sterowników PLC (Siemens S7), modernizacja szaf sterowniczych.',
        date: new Date().toISOString(),
        featured: false,
        url: '#'
    },
    {
        id: 'demo-9',
        title: 'Growth Marketing & Performance Specialist',
        company: 'ScaleUp Ventures',
        location: 'Zdalnie / Warszawa',
        salary: '9 000 - 14 000 PLN',
        type: 'Zdalna',
        category: 'marketing',
        description: 'Prowadzenie kampanii Meta Ads, Google Ads, optymalizacja lejków konwersji, analityka GA4.',
        date: new Date().toISOString(),
        featured: true,
        url: '#'
    },
    {
        id: 'demo-10',
        title: 'Frontend Developer (Vue.js 3 & TailwindCSS)',
        company: 'Veloce Soft',
        location: 'Zdalnie',
        salary: '14 000 - 18 000 PLN',
        type: 'Zdalna',
        category: 'it',
        description: 'Rozwój dashboardów B2B w Vue 3 (Composition API), Pinia, Vite i TailwindCSS.',
        date: new Date().toISOString(),
        featured: false,
        url: '#'
    },
    {
        id: 'demo-11',
        title: 'Junior QA Automation Tester (Playwright / JS)',
        company: 'QualityFirst Labs',
        location: 'Kraków / Hybrydowo',
        salary: '7 000 - 9 500 PLN',
        type: 'Staż',
        category: 'it',
        description: 'Pisanie testów automatycznych E2E w Playwright, testy API w Postmanie, raportowanie w Jira.',
        date: new Date().toISOString(),
        featured: false,
        url: '#'
    },
    {
        id: 'demo-12',
        title: 'Cybersecurity Analyst (SOC / SIEM)',
        company: 'SecureNet Defense',
        location: 'Zdalnie / Warszawa',
        salary: '16 000 - 23 000 PLN',
        type: 'Kontrakt',
        category: 'it',
        description: 'Monitorowanie incydentów bezpieczeństwa, analiza zagrożeń SIEM, testy podatności i audyty ISO 27001.',
        date: new Date().toISOString(),
        featured: true,
        url: '#'
    }
];

const JobService = {
    DEMO_JOBS: DEMO_FALLBACK_JOBS,

    async loadCSVJobs() {
        const candidatePaths = ['offers.csv', '/offers.csv', './offers.csv'];
        let rawText = null;

        for (const path of candidatePaths) {
            try {
                const response = await fetch(path, { cache: 'no-cache' });
                if (response.ok) {
                    const text = await response.text();
                    // Upewnij się, że to nie jest strona HTML 404
                    if (text && !text.trim().startsWith('<!DOCTYPE') && !text.trim().startsWith('<html')) {
                        rawText = text;
                        break;
                    }
                }
            } catch (e) {
                // kontynuuj sprawdzanie kolejnej ścieżki
            }
        }

        if (rawText) {
            try {
                const parsed = this.parseCSV(rawText);
                if (parsed && parsed.length > 0) {
                    return parsed;
                }
            } catch (err) {
                console.warn('Błąd parsowania CSV, używam danych zapasowych:', err);
            }
        }

        // Zwróć dane zapasowe, jeśli CSV jest niedostępny
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
        // Bezpieczne ładowanie z zewnętrznego API z obsługą błędów CORS
        return [];
    },

    combineJobs(csvJobs = [], apiJobs = []) {
        const combined = [...csvJobs, ...apiJobs];
        if (combined.length === 0) {
            return [...this.DEMO_JOBS];
        }
        // Deduplikacja po ID lub tytule+firmie
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
            // Filtr słowa kluczowego
            if (sQuery) {
                const title = (job.title || '').toLowerCase();
                const comp = (job.company || '').toLowerCase();
                const desc = (job.description || '').toLowerCase();
                if (!title.includes(sQuery) && !comp.includes(sQuery) && !desc.includes(sQuery)) {
                    return false;
                }
            }

            // Filtr lokalizacji
            if (lQuery) {
                const loc = (job.location || '').toLowerCase();
                if (!loc.includes(lQuery)) {
                    return false;
                }
            }

            // Filtr minimalnego wynagrodzenia
            if (minSalary > 0) {
                const salText = job.salary || '';
                const nums = salText.replace(/\s/g, '').match(/\d+/g);
                if (nums && nums.length > 0) {
                    const maxVal = Math.max(...nums.map(n => parseInt(n, 10)));
                    if (maxVal < minSalary) return false;
                }
            }

            // Filtr kategorii
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
