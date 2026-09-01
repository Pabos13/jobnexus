/**
 * CSV Parser Tests
 */

import { CSVParser } from '../services/csvParser.js';

describe('CSVParser', () => {
    describe('parse', () => {
        it('should parse simple CSV correctly', () => {
            const csv = 'title;company;location\nDeveloper;TechCorp;Warszawa';
            const result = CSVParser.parse(csv);
            
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Developer');
            expect(result[0].company).toBe('TechCorp');
        });

        it('should handle quoted fields with semicolons', () => {
            const csv = 'title;description\n"Senior Dev";"Code; manage team"';
            const result = CSVParser.parse(csv);
            
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Senior Dev');
            expect(result[0].description).toBe('Code; manage team');
        });

        it('should skip empty lines', () => {
            const csv = 'title;company\nDev;Corp\n\nDev2;Corp2';
            const result = CSVParser.parse(csv);
            
            expect(result).toHaveLength(2);
        });

        it('should throw error for empty CSV', () => {
            expect(() => CSVParser.parse('')).toThrow();
        });

        it('should throw error for CSV without headers', () => {
            expect(() => CSVParser.parse('OnlyDataLine')).toThrow();
        });
    });

    describe('sanitize', () => {
        it('should remove HTML tags', () => {
            const dirty = '<script>alert("xss")</script>';
            const clean = CSVParser.sanitize(dirty);
            
            expect(clean).not.toContain('<');
            expect(clean).not.toContain('>');
        });

        it('should limit string length to 500', () => {
            const long = 'a'.repeat(600);
            const result = CSVParser.sanitize(long);
            
            expect(result.length).toBeLessThanOrEqual(500);
        });

        it('should trim whitespace', () => {
            const dirty = '  hello world  ';
            const clean = CSVParser.sanitize(dirty);
            
            expect(clean).toBe('hello world');
        });
    });

    describe('normalizeJob', () => {
        it('should normalize CSV job object', () => {
            const raw = {
                stanowisko: 'Developer',
                pracodawca: 'TechCorp',
                miejsce_pracy: 'Warszawa'
            };
            
            const normalized = CSVParser.normalizeJob(raw);
            
            expect(normalized).toHaveProperty('id');
            expect(normalized.title).toBe('Developer');
            expect(normalized.company).toBe('TechCorp');
            expect(normalized.source).toBe('csv');
        });

        it('should use default values for missing fields', () => {
            const raw = {};
            const normalized = CSVParser.normalizeJob(raw);
            
            expect(normalized.title).toBe('Oferta pracy');
            expect(normalized.company).toBe('Pracodawca');
            expect(normalized.location).toBe('Polska');
        });
    });
});
