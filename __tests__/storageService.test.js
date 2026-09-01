/**
 * Storage Service Tests
 */

import { jest } from '@jest/globals';
import { StorageService } from '../services/storageService.js';

describe('StorageService', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    describe('announcements', () => {
        it('should save announcements', () => {
            const announcements = [
                { id: '1', title: 'Test' }
            ];
            
            StorageService.saveAnnouncements(announcements);
            const loaded = StorageService.loadAnnouncements();
            
            expect(loaded).toEqual(announcements);
        });

        it('should return empty array if no announcements', () => {
            const loaded = StorageService.loadAnnouncements();
            expect(loaded).toEqual([]);
        });
    });

    describe('search history', () => {
        it('should add search to history', () => {
            StorageService.addSearchHistory('developer');
            const history = StorageService.getSearchHistory();
            
            expect(history).toContain('developer');
        });

        it('should remove duplicates', () => {
            StorageService.addSearchHistory('developer');
            StorageService.addSearchHistory('developer');
            const history = StorageService.getSearchHistory();
            
            expect(history.filter(h => h === 'developer')).toHaveLength(1);
        });

        it('should keep only last 20 searches', () => {
            for (let i = 0; i < 25; i++) {
                StorageService.addSearchHistory(`search${i}`);
            }
            
            const history = StorageService.getSearchHistory();
            expect(history.length).toBeLessThanOrEqual(20);
        });
    });

    describe('CV matches', () => {
        it('should save and load CV matches', () => {
            const matches = [
                { id: '1', title: 'Job1' }
            ];
            
            StorageService.saveCVMatches(matches);
            const loaded = StorageService.loadCVMatches();
            
            expect(loaded).toEqual(matches);
        });

        it('should invalidate old CV matches', () => {
            jest.useFakeTimers();
            
            const matches = [{ id: '1', title: 'Job1' }];
            StorageService.saveCVMatches(matches);
            
            // Advance time by 25 hours
            jest.advanceTimersByTime(25 * 60 * 60 * 1000);
            
            const loaded = StorageService.loadCVMatches();
            expect(loaded).toEqual([]);
            
            jest.useRealTimers();
        });
    });
});
