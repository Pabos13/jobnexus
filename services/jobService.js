/**
 * Job Service
 * Handles all job-related API calls and fallbacks
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
     * Load jobs from Jooble API or demo data
     * @param {string} keywords - Search keywords
     * @param {string} location - Job location
     * @returns {Promise<Array>} Array of job objects
     */
    static async loadJoobleJobs(keywords = 'praca', location = 'Polska') {
        const JOOBLE_KEY = '5be594f9-f5e0-41f5-a41a-9c1ea12566be';
        
        // 1. Try Jooble API directly
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT || 8000);
            const response = await fetch(`https://jooble.org/api/${JOOBLE_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    keywords: keywords || 'praca', 
                    location: location || 'Polska' 
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.jobs && Array.isArray(data.jobs) && data.jobs.length > 0) {
                    return data.jobs.map(job => this.normalizeJoobleJob(job));
                }
            }
        } catch (err) {
            console.warn('Direct Jooble API attempt:', err.message);
        }

        // 2. Try Backend Proxy if available
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const response = await fetch(`${CONFIG.API_BASE_URL}/jobs/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keywords, location }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.jobs && Array.isArray(data.jobs) && data.jobs.length > 0) {
                    return data.jobs.map(job => this.normalizeJoobleJob(job));
                }
            }
        } catch (err) {
            // silent fallback
        }

        // 3. Fallback to Demo jobs filtered by query
        console.info('Using high quality demo jobs');
        return this.filterJobs(this.getDemoJobs(), { searchQuery: keywords, locationQuery: location, currentFilter: 'all' });
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
            type: this.detectJobType(raw.title, raw.snippet || ''),
            salary: raw.salary || 'Do negocjacji',
            date: raw.updated || raw.date || new Date().toISOString().split('T')[0],
            description: (raw.snippet || raw.description || '').replace(/<\/?[^>]+(>|$)/g, ''),
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
            'Frontend Developer React & TypeScript', 'Backend Developer Node.js / Express', 'Fullstack Developer (React + Node)',
            'DevOps Engineer (AWS/Docker)', 'Data Scientist & AI Specialist', 'Product Manager B2B',
            'UX/UI Designer Figma', 'QA Automation Engineer', 'Scrum Master / Agile Coach',
            'Java Spring Boot Developer', 'Python Django / FastAPI Developer', 'Mobile Developer (React Native / Flutter)',
            'Cloud Architect (GCP/Azure)', 'Security Engineer & Pentester', 'Machine Learning Engineer',
            'Project Manager IT', 'Business System Analyst', 'HR Specialist / Tech Recruiter',
            'Performance Marketing Specialist', 'B2B Sales Representative', 'Samodzielna Księgowa',
            'Customer Support Specialist', 'SEO & Content Specialist', 'Graphic Designer 3D'
        ];
        
        const companies = [
            'TechCorp Poland', 'InnovateSoft', 'Digital Ventures',
            'CloudNative Sp. z o.o.', 'DataDriven AI', 'FutureWorks Labs',
            'CodeCraft Studio', 'AppMasters Group', 'WebSolutions Polska',
            'SmartSystems Enterprise', 'NextGen IT', 'CyberShield Security'
        ];
        
        const locations = [
            'Warszawa, mazowieckie', 'Kraków, małopolskie', 'Wrocław, dolnośląskie',
            'Gdańsk, pomorskie', 'Poznań, wielkopolskie', 'Łódź, łódzkie',
            'Katowice, śląskie', 'Lublin, lubelskie', 'Szczecin, zachodniopomorskie',
            'Zdalnie', 'Zdalnie (Polska)', 'Wrocław / Zdalnie'
        ];
        
        const types = ['Pełny etat', 'Zdalna', 'Kontrakt', 'Staż', 'Część etatu'];
        
        return demoTitles.map((title, i) => ({
            id: `demo-${i}`,
            title,
            company: companies[i % companies.length],
            location: locations[i % locations.length],
            type: types[i % types.length],
            salary: `${9000 + (i * 600)} - ${14000 + (i * 900)} PLN`,
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
            description: `Poszukujemy osoby na stanowisko ${title}. Oferujemy pracę w nowoczesnym środowisku, stabilne zatrudnienie, elastyczne godziny oraz pakiet benefitów (Multisport, opieka medyczna).`,
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
        (csvJobs || []).forEach(job => {
            const key = `${job.title}|${job.company}`.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                combined.push(job);
            }
        });
        
        // Add API jobs, skip duplicates
        (apiJobs || []).forEach(job => {
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
        let filtered = [...(jobs || [])];
        
        // Text search
        if (filters && filters.searchQuery) {
            const q = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(j =>
                (j.title && j.title.toLowerCase().includes(q)) ||
                (j.company && j.company.toLowerCase().includes(q)) ||
                (j.description && j.description.toLowerCase().includes(q))
            );
        }
        
        // Location filter
        if (filters && filters.locationQuery) {
            const loc = filters.locationQuery.toLowerCase();
            filtered = filtered.filter(j =>
                j.location && j.location.toLowerCase().includes(loc)
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
        
        if (filters && filters.currentFilter !== 'all' && filterMap[filters.currentFilter]) {
            const typeQ = filterMap[filters.currentFilter];
            filtered = filtered.filter(j =>
                j.type && j.type.toLowerCase().includes(typeQ)
            );
        }
        
        // Sort: featured first, then by date
        filtered.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return new Date(b.date || 0) - new Date(a.date || 0);
        });
        
        return filtered;
    }
}

export default JobService;
