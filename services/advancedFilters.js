/**
 * Advanced Filters Module
 * Enhanced filtering with salary range, tech stack, and more
 */

export class AdvancedFilters {
    static FILTER_OPTIONS = {
        salaryRange: {
            min: 0,
            max: 50000,
            step: 1000
        },
        experienceLevels: [
            { value: 'junior', label: 'Junior (0-2 years)' },
            { value: 'mid', label: 'Mid-level (2-5 years)' },
            { value: 'senior', label: 'Senior (5+ years)' }
        ],
        companySize: [
            { value: 'startup', label: 'Startup (1-50)' },
            { value: 'small', label: 'Small (50-250)' },
            { value: 'medium', label: 'Medium (250-1000)' },
            { value: 'large', label: 'Large (1000+)' }
        ],
        workMode: [
            { value: 'remote', label: 'Remote' },
            { value: 'hybrid', label: 'Hybrid' },
            { value: 'office', label: 'Office' }
        ],
        techStack: [
            'JavaScript', 'Python', 'Java', 'C#', 'Go', 'Rust',
            'React', 'Vue', 'Angular', 'Node.js', 'Django', 'Spring',
            'SQL', 'MongoDB', 'PostgreSQL', 'Redis',
            'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure'
        ]
    };

    /**
     * Apply advanced filters to jobs
     * @param {Array} jobs - Jobs to filter
     * @param {Object} filters - Filter criteria
     * @returns {Array} Filtered jobs
     */
    static applyFilters(jobs, filters) {
        let filtered = [...jobs];

        // Salary range filter
        if (filters.salaryMin !== undefined || filters.salaryMax !== undefined) {
            filtered = this.filterBySalary(filtered, filters.salaryMin, filters.salaryMax);
        }

        // Experience level filter
        if (filters.experienceLevel) {
            filtered = this.filterByExperience(filtered, filters.experienceLevel);
        }

        // Company size filter
        if (filters.companySize) {
            filtered = this.filterByCompanySize(filtered, filters.companySize);
        }

        // Work mode filter
        if (filters.workMode) {
            filtered = this.filterByWorkMode(filtered, filters.workMode);
        }

        // Tech stack filter
        if (filters.techStack && filters.techStack.length > 0) {
            filtered = this.filterByTechStack(filtered, filters.techStack);
        }

        return filtered;
    }

    /**
     * Filter by salary range
     * @private
     */
    static filterBySalary(jobs, min, max) {
        return jobs.filter(job => {
            const salary = this.extractSalary(job.salary);
            if (salary === null) return true; // Keep jobs with unknown salary
            return salary >= (min || 0) && salary <= (max || 999999);
        });
    }

    /**
     * Extract numeric salary from string
     * @private
     */
    static extractSalary(salaryStr) {
        if (!salaryStr) return null;
        const match = salaryStr.match(/\d+/);
        return match ? parseInt(match[0]) : null;
    }

    /**
     * Filter by experience level
     * @private
     */
    static filterByExperience(jobs, level) {
        const keywords = {
            junior: ['junior', 'mł', 'początkujący', 'trainee'],
            mid: ['mid', 'middle', 'regular', 'doświadczony'],
            senior: ['senior', 'senior+', 'lead', 'head']
        };

        return jobs.filter(job => {
            const text = `${job.title} ${job.description}`.toLowerCase();
            return keywords[level]?.some(kw => text.includes(kw)) || false;
        });
    }

    /**
     * Filter by company size
     * @private
     */
    static filterByCompanySize(jobs, size) {
        const keywords = {
            startup: ['startup', 'young', 'new company'],
            small: ['small', 'boutique'],
            medium: ['medium-sized'],
            large: ['large', 'enterprise', 'corporation', 'group']
        };

        return jobs.filter(job => {
            const text = `${job.company} ${job.description}`.toLowerCase();
            return keywords[size]?.some(kw => text.includes(kw)) || false;
        });
    }

    /**
     * Filter by work mode
     * @private
     */
    static filterByWorkMode(jobs, mode) {
        const modeMap = {
            remote: 'Zdalna',
            hybrid: 'Hybrid',
            office: 'Biuro'
        };

        return jobs.filter(job => {
            const jobMode = job.type?.toLowerCase() || '';
            return jobMode.includes(modeMap[mode]?.toLowerCase() || mode);
        });
    }

    /**
     * Filter by tech stack
     * @private
     */
    static filterByTechStack(jobs, techStack) {
        return jobs.filter(job => {
            const text = `${job.title} ${job.description}`.toLowerCase();
            return techStack.some(tech => text.includes(tech.toLowerCase()));
        });
    }

    /**
     * Get all available filter options
     * @returns {Object} Filter options
     */
    static getFilterOptions() {
        return this.FILTER_OPTIONS;
    }
}

export default AdvancedFilters;
