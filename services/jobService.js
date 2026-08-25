/**
 * Job Service
 * Handles all job-related API calls through backend proxy
 */

import { CONFIG } from '../config.js';
import { CSVParser } from './csvParser.js';

export class JobService {
    /**
     * Load jobs from CSV file
     * @returns {Promise<Array>} Array of job objects
     */
    static async loadCSVJobs() {
        try {
            const response = await fetch(CONFIG.CSV_PATH);
            if (!response.ok) throw new Error(`CSV loading failed: ${response.status}`);
            
            const text = await response.text();
            const rows = CSVParser.parse(text);
            
            return rows.map(row => CSVParser.normalizeJob(row));
        } catch (err) {
            console.warn('CSV load error:', err.message);
            return [];
        }
    }
    
    /**
     * Load jobs from Jooble API via backend proxy
     * @param {string} keywords - Search keywords
     * @param {string} location - Job location
     * @returns {Promise<Array>} Array of job objects
     */
    static async loadJoobleJobs(keywords = 'praca', location = 'Polska') {
        try {
            // Call backend proxy instead of Jooble directly
            const response = await fetch(`${CONFIG.API_BASE_URL}/jobs/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keywords, location }),
                timeout: CONFIG.API_TIMEOUT
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.jobs && Array.isArray(data.jobs)) {
                return data.jobs.map(job => this.normalizeJoobleJob(job));
            }
            
            return [];
        } catch (err) {
            console.warn('Jooble API error:', err.message);
            console.info('Using demo data as fallback');
            return this.getDemoJobs();
        }
    }
    
    /**
     * Normalize job from Jooble API
     * @param {Object} raw - Raw job from API
     * @returns {Object} Normalized job object
     */
    static normalizeJoobleJob(raw) {
        return {
            id: raw.id || `jooble-${Math.random().toString(36).substr(2, 9)}`,
            title: raw.title || 'Oferta pracy',
            company: raw.company || 'Pracodawca',
            location: raw.location || 'Polska',
            type: this.detectJobType(raw.title, raw.snippet),
            salary: raw.salary || 'Do negocjacji',
            date: raw.updated || raw.date || new Date().toISOString().split('T')[0],
            description: raw.snippet || raw.description || '',
            source: 'jooble',
            featured: false,
            url: raw.link || raw.url || '#'
        };
    }
    
    /**
     * Detect job type from title and description
     * @param {string} title - Job title
     * @param {string} desc - Job description
     * @returns {string} Job type
     */
    static detectJobType(title, desc) {
        const text = `${title} ${desc}`.toLowerCase();
        
        if (text.includes('zdaln') || text.includes('remote')) return 'Zdalna';
        if (text.includes('staż') || text.includes('praktyk') || text.includes('intern')) return 'Staż';
        if (text.includes('kontrakt') || text.includes('b2b') || text.includes('contract')) return 'Kontrakt';
        if (text.includes('część') || text.includes('part') || text.includes('half')) return 'Część etatu';
        
        return 'Pełny etat';
    }
    
    /**
     * Get demo jobs for fallback
     * @returns {Array} Demo job objects
     */
    static getDemoJobs() {
        const demoTitles = [
            'Frontend Developer React', 'Backend Developer Node.js', 'Fullstack Developer',
            'DevOps Engineer', 'Data Scientist', 'Product Manager',
            'UX/UI Designer', 'QA Engineer', 'Scrum Master',
            'Java Developer', 'Python Developer', 'Mobile Developer',
            'Cloud Architect', 'Security Engineer', 'ML Engineer',
            'Project Manager', 'Business Analyst', 'HR Specialist',
            'Marketing Manager', 'Sales Representative', 'Accountant',
            'Customer Support', 'Content Writer', 'Graphic Designer'
        ];
        
        const companies = [
            'TechCorp Poland', 'InnovateSoft', 'Digital Ventures',
            'CloudNative Sp. z o.o.', 'DataDriven', 'FutureWorks',
            'CodeCraft', 'AppMasters', 'WebSolutions',
            'SmartSystems', 'NextGen IT', 'CyberShield'
        ];
        
        const locations = [
            'Warszawa, mazowieckie', 'Kraków, małopolskie', 'Wrocław, dolnośląskie',
            'Gdańsk, pomorskie', 'Poznań, wielkopolskie', 'Łódź, łódzkie',
            'Katowice, śląskie', 'Lublin, lubelskie', 'Szczecin, zachodniopomorskie',
            'Bydgoszcz, kujawsko-pomorskie', 'Białystok, podlaskie', 'Toruń, kujawsko-pomorskie'
        ];
        
        const types = ['Pełny etat', 'Zdalna', 'Kontrakt', 'Staż', 'Część etatu'];
        
        return demoTitles.map((title, i) => ({
            id: `demo-${i}`,
            title,
            company: companies[i % companies.length],
            location: locations[i % locations.length],
            type: types[i % types.length],
            salary: `${8000 + (i * 500)} - ${12000 + (i * 800)} zł`,
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
            description: `Szukamy ${title} do naszego zespołu. Atrakcyjne warunki, możliwość rozwoju.`,
            source: 'demo',
            featured: i < 3,
            url: '#'
        }));
    }
    
    /**
     * Combine and deduplicate jobs from multiple sources
     * @param {Array} csvJobs - Jobs from CSV
     * @param {Array} apiJobs - Jobs from API
     * @returns {Array} Combined jobs
     */
    static combineJobs(csvJobs, apiJobs) {
        const seen = new Set();
        const combined = [];
        
        // Add CSV jobs first (local data takes priority)
        csvJobs.forEach(job => {
            const key = `${job.title}|${job.company}`.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                combined.push(job);
            }
        });
        
        // Add API jobs, skip duplicates
        apiJobs.forEach(job => {
            const key = `${job.title}|${job.company}`.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                combined.push(job);
            }
        });
        
        return combined;
    }
    
    /**
     * Filter and sort jobs
     * @param {Array} jobs - Jobs to filter
     * @param {Object} filters - Filter criteria
     * @returns {Array} Filtered jobs
     */
    static filterJobs(jobs, filters) {
        let filtered = [...jobs];
        
        // Text search
        if (filters.searchQuery) {
            const q = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(j =>
                j.title.toLowerCase().includes(q) ||
                j.company.toLowerCase().includes(q) ||
                j.description.toLowerCase().includes(q)
            );
        }
        
        // Location filter
        if (filters.locationQuery) {
            const loc = filters.locationQuery.toLowerCase();
            filtered = filtered.filter(j =>
                j.location.toLowerCase().includes(loc)
            );
        }
        
        // Type filter
        const filterMap = {
            'fulltime': 'pełny etat',
            'parttime': 'część etatu',
            'remote': 'zdalna',
            'contract': 'kontrakt',
            'internship': 'staż'
        };
        
        if (filters.currentFilter !== 'all' && filterMap[filters.currentFilter]) {
            const typeQ = filterMap[filters.currentFilter];
            filtered = filtered.filter(j =>
                j.type.toLowerCase().includes(typeQ)
            );
        }
        
        // Sort: featured first, then by date
        filtered.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return new Date(b.date) - new Date(a.date);
        });
        
        return filtered;
    }
}

export default JobService;
