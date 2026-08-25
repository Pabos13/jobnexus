/**
 * Notification Service
 * Handles in-app notifications and alerts
 */

export class NotificationService {
    static STORAGE_KEY = 'jobnexus_notifications';
    static NOTIFICATION_TYPES = {
        NEW_JOB: 'new_job',
        APPLICATION: 'application',
        MESSAGE: 'message',
        ALERT: 'alert',
        SUCCESS: 'success'
    };

    /**
     * Create notification
     * @param {Object} notification - Notification object
     */
    static create(notification) {
        try {
            const fullNotification = {
                id: `notif-${Date.now()}`,
                read: false,
                createdAt: new Date().toISOString(),
                ...notification
            };

            const notifications = this.getAll();
            notifications.unshift(fullNotification);
            
            // Keep only last 50
            const limited = notifications.slice(0, 50);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limited));

            // Show toast
            this.showToastNotification(fullNotification);

            return fullNotification;
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }

    /**
     * Create new job notification
     * @param {Object} job - Job object
     */
    static notifyNewJob(job) {
        this.create({
            type: this.NOTIFICATION_TYPES.NEW_JOB,
            title: 'New Job Posted',
            message: `${job.title} at ${job.company}`,
            data: { jobId: job.id, job }
        });
    }

    /**
     * Create application notification
     * @param {string} jobTitle - Job title
     * @param {string} status - Application status
     */
    static notifyApplication(jobTitle, status) {
        this.create({
            type: this.NOTIFICATION_TYPES.APPLICATION,
            title: 'Application Update',
            message: `Your application for "${jobTitle}" is ${status}`,
            data: { status }
        });
    }

    /**
     * Create alert notification
     * @param {string} title - Alert title
     * @param {string} message - Alert message
     */
    static notifyAlert(title, message) {
        this.create({
            type: this.NOTIFICATION_TYPES.ALERT,
            title,
            message
        });
    }

    /**
     * Create success notification
     * @param {string} message - Success message
     */
    static notifySuccess(message) {
        this.create({
            type: this.NOTIFICATION_TYPES.SUCCESS,
            title: 'Success',
            message
        });
    }

    /**
     * Get all notifications
     * @returns {Array}
     */
    static getAll() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.warn('Error getting notifications:', error);
            return [];
        }
    }

    /**
     * Mark notification as read
     * @param {string} notificationId - Notification ID
     */
    static markAsRead(notificationId) {
        try {
            const notifications = this.getAll();
            const notification = notifications.find(n => n.id === notificationId);
            
            if (notification) {
                notification.read = true;
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }

    /**
     * Get unread count
     * @returns {number}
     */
    static getUnreadCount() {
        return this.getAll().filter(n => !n.read).length;
    }

    /**
     * Clear all notifications
     */
    static clearAll() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    }

    /**
     * Show toast notification in UI
     * @private
     */
    static showToastNotification(notification) {
        const toast = document.createElement('div');
        toast.className = `notification-toast notification-${notification.type}`;
        toast.innerHTML = `
            <div class="notification-content">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        document.body.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
}

export default NotificationService;
