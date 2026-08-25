import { AdvancedFilters } from '../services/advancedFilters.js';

describe('AdvancedFilters', () => {
    const jobs = [
        {
            id: '1',
            title: 'Senior React Developer',
            company: 'Bright Startup',
            description: 'Lead a React team in a young company',
            salary: '18000 - 24000 zł',
            type: 'Zdalna'
        },
        {
            id: '2',
            title: 'Junior Python Developer',
            company: 'Enterprise Group',
            description: 'Trainee role using Python',
            salary: '8000 zł',
            type: 'Biuro'
        },
        {
            id: '3',
            title: 'Regular Java Engineer',
            company: 'Boutique Labs',
            description: 'Middle developer for a small team',
            salary: 'Undisclosed',
            type: 'Hybrid'
        }
    ];

    it('applies multiple filters without mutating the input jobs', () => {
        const result = AdvancedFilters.applyFilters(jobs, {
            salaryMin: 15_000,
            salaryMax: 20_000,
            experienceLevel: 'senior',
            companySize: 'startup',
            workMode: 'remote',
            techStack: ['React']
        });

        expect(result).toEqual([jobs[0]]);
        expect(jobs).toHaveLength(3);
    });

    it('keeps jobs with unknown salaries and filters known salary values', () => {
        expect(AdvancedFilters.filterBySalary(jobs, 10_000, 20_000)).toEqual([
            jobs[0],
            jobs[2]
        ]);
        expect(AdvancedFilters.extractSalary('12 000 zł')).toBe(12);
        expect(AdvancedFilters.extractSalary('Undisclosed')).toBeNull();
        expect(AdvancedFilters.extractSalary()).toBeNull();
    });

    it.each([
        ['junior', ['2']],
        ['mid', ['3']],
        ['senior', ['1']],
        ['unknown', []]
    ])('filters %s experience jobs', (level, expectedIds) => {
        expect(AdvancedFilters.filterByExperience(jobs, level).map(job => job.id)).toEqual(expectedIds);
    });

    it.each([
        ['startup', ['1']],
        ['small', ['3']],
        ['large', ['2']],
        ['unknown', []]
    ])('filters %s company sizes', (size, expectedIds) => {
        expect(AdvancedFilters.filterByCompanySize(jobs, size).map(job => job.id)).toEqual(expectedIds);
    });

    it.each([
        ['remote', ['1']],
        ['hybrid', ['3']],
        ['office', ['2']]
    ])('filters %s work modes', (mode, expectedIds) => {
        expect(AdvancedFilters.filterByWorkMode(jobs, mode).map(job => job.id)).toEqual(expectedIds);
    });

    it('filters by any selected technology', () => {
        expect(AdvancedFilters.filterByTechStack(jobs, ['Python', 'Java']).map(job => job.id)).toEqual([
            '2',
            '3'
        ]);
    });

    it('returns the available filter options', () => {
        expect(AdvancedFilters.getFilterOptions()).toBe(AdvancedFilters.FILTER_OPTIONS);
        expect(AdvancedFilters.getFilterOptions().techStack).toContain('JavaScript');
    });
});
