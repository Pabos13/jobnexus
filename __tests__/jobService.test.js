/**
 * Job Service Tests
 */

import { JobService } from '../services/jobService.js';

describe('JobService', () => {
    describe('combineJobs', () => {
        it('should combine CSV and API jobs', () => {
            const csvJobs = [
                { id: '1', title: 'Dev', company: 'Corp1' }
            ];
            const apiJobs = [
                { id: '2', title: 'Designer', company: 'Corp2' }
            ];
            
            const combined = JobService.combineJobs(csvJobs, apiJobs);
            
            expect(combined).toHaveLength(2);
            expect(combined[0].title).toBe('Dev');
            expect(combined[1].title).toBe('Designer');
        });

        it('should remove duplicates by title and company', () => {
            const csvJobs = [
                { id: '1', title: 'Dev', company: 'Corp' }
            ];
            const apiJobs = [
                { id: '2', title: 'Dev', company: 'Corp' } // duplicate
            ];
            
            const combined = JobService.combineJobs(csvJobs, apiJobs);
            
            expect(combined).toHaveLength(1);
        });
    });

    describe('filterJobs', () => {
        const jobs = [
            {
                id: '1',
                title: 'Frontend Developer',
                company: 'TechCorp',
                type: 'Zdalna',
                location: 'Warszawa',
                description: 'React developer needed',
                featured: true
            },
            {
                id: '2',
                title: 'Backend Developer',
                company: 'WebCorp',
                type: 'Pełny etat',
                location: 'Kraków',
                description: 'Node.js developer',
                featured: false
            }
        ];

        it('should filter by search query', () => {
            const filters = {
                searchQuery: 'Frontend',
                locationQuery: '',
                currentFilter: 'all'
            };
            
            const filtered = JobService.filterJobs(jobs, filters);
            
            expect(filtered).toHaveLength(1);
            expect(filtered[0].title).toBe('Frontend Developer');
        });

        it('should filter by location', () => {
            const filters = {
                searchQuery: '',
                locationQuery: 'Warszawa',
                currentFilter: 'all'
            };
            
            const filtered = JobService.filterJobs(jobs, filters);
            
            expect(filtered).toHaveLength(1);
            expect(filtered[0].location).toBe('Warszawa');
        });

        it('should filter by job type', () => {
            const filters = {
                searchQuery: '',
                locationQuery: '',
                currentFilter: 'remote'
            };
            
            const filtered = JobService.filterJobs(jobs, filters);
            
            expect(filtered).toHaveLength(1);
            expect(filtered[0].type).toBe('Zdalna');
        });

        it('should sort featured jobs first', () => {
            const filters = {
                searchQuery: '',
                locationQuery: '',
                currentFilter: 'all'
            };
            
            const filtered = JobService.filterJobs(jobs, filters);
            
            expect(filtered[0].featured).toBe(true);
            expect(filtered[1].featured).toBe(false);
        });
    });

    describe('detectJobType', () => {
        it('should detect remote jobs', () => {
            const type = JobService.detectJobType('Remote Developer', 'Work from home');
            expect(type).toBe('Zdalna');
        });

        it('should detect internships', () => {
            const type = JobService.detectJobType('Junior Developer', 'internship program');
            expect(type).toBe('Staż');
        });

        it('should detect contracts', () => {
            const type = JobService.detectJobType('Contractor', 'B2B contract');
            expect(type).toBe('Kontrakt');
        });

        it('should default to full-time', () => {
            const type = JobService.detectJobType('Developer', 'Standard role');
            expect(type).toBe('Pełny etat');
        });
    });
});
