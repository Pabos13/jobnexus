import { jest } from '@jest/globals';
import { NotificationService } from '../services/notificationService.js';

describe('NotificationService', () => {
    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = '';
        jest.useFakeTimers();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    it('creates, stores, and displays a notification toast', () => {
        jest.spyOn(Date, 'now').mockReturnValue(1234);

        const notification = NotificationService.create({
            type: NotificationService.NOTIFICATION_TYPES.SUCCESS,
            title: 'Saved',
            message: 'Your changes were saved'
        });

        expect(notification).toEqual(expect.objectContaining({
            id: 'notif-1234',
            read: false,
            type: 'success',
            title: 'Saved'
        }));
        expect(NotificationService.getAll()).toEqual([notification]);
        expect(document.querySelector('.notification-success')).not.toBeNull();

        jest.advanceTimersByTime(5000);
        expect(document.querySelector('.notification-success')).toBeNull();
    });

    it('keeps only the 50 most recent notifications', () => {
        const existing = Array.from({ length: 50 }, (_, index) => ({
            id: `old-${index}`,
            read: false
        }));
        localStorage.setItem(NotificationService.STORAGE_KEY, JSON.stringify(existing));

        const created = NotificationService.create({
            type: 'alert',
            title: 'Newest',
            message: 'Message'
        });

        const stored = NotificationService.getAll();
        expect(stored).toHaveLength(50);
        expect(stored[0].id).toBe(created.id);
        expect(stored).not.toContainEqual(existing[49]);
    });

    it('maps convenience helpers to notification payloads', () => {
        const createSpy = jest.spyOn(NotificationService, 'create').mockImplementation(() => {});
        const job = { id: 'job-1', title: 'Developer', company: 'TechCorp' };

        NotificationService.notifyNewJob(job);
        NotificationService.notifyApplication(job.title, 'accepted');
        NotificationService.notifyAlert('Reminder', 'Complete your profile');
        NotificationService.notifySuccess('Profile updated');

        expect(createSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({
            type: 'new_job',
            message: 'Developer at TechCorp',
            data: { jobId: job.id, job }
        }));
        expect(createSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({
            type: 'application',
            data: { status: 'accepted' }
        }));
        expect(createSpy).toHaveBeenNthCalledWith(3, {
            type: 'alert',
            title: 'Reminder',
            message: 'Complete your profile'
        });
        expect(createSpy).toHaveBeenNthCalledWith(4, {
            type: 'success',
            title: 'Success',
            message: 'Profile updated'
        });
    });

    it('marks a notification as read and reports unread count', () => {
        localStorage.setItem(NotificationService.STORAGE_KEY, JSON.stringify([
            { id: '1', read: false },
            { id: '2', read: false }
        ]));

        NotificationService.markAsRead('1');

        expect(NotificationService.getAll()[0].read).toBe(true);
        expect(NotificationService.getUnreadCount()).toBe(1);
    });

    it('leaves stored notifications unchanged for a missing ID', () => {
        const notifications = [{ id: '1', read: false }];
        localStorage.setItem(NotificationService.STORAGE_KEY, JSON.stringify(notifications));

        NotificationService.markAsRead('missing');

        expect(NotificationService.getAll()).toEqual(notifications);
    });

    it('clears all notifications', () => {
        localStorage.setItem(NotificationService.STORAGE_KEY, JSON.stringify([{ id: '1' }]));

        NotificationService.clearAll();

        expect(NotificationService.getAll()).toEqual([]);
    });

    it('returns an empty list for invalid stored notifications', () => {
        localStorage.setItem(NotificationService.STORAGE_KEY, '{invalid');

        expect(NotificationService.getAll()).toEqual([]);
    });
});
