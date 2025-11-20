export interface Notification {
  id?: string;
  title: string;
  message: string;
  type: 'announcement' | 'event' | 'reminder' | 'system';
  targetUsers: 'all' | 'specific_barangay' | 'specific_users';
  targetBarangay?: string;
  targetUserIds?: string[];
  data?: any; // Additional data like eventId, announcementId
  sentAt: Date;
  readBy: string[]; // User IDs who read the notification
}