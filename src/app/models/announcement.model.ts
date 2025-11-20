// src/app/models/announcement.model.ts

export interface Announcement {
  id?: string;
  title: string;
  content: string;
  category: 'general' | 'emergency' | 'event' | 'meeting' | 'public_service';
  
  // 5W1H Format (Required for all non-'general' categories)
  what: string;
  when: string; // Format: "Nov 11, 2025, 5:00 PM - 7:00 PM" or "Nov 11, 2025"
  where: string;
  who: string; // Target audience
  why: string;
  how: string;
  
  imageUrl?: string;
  imageBase64?: string;
  createdBy: string; // User UID of the Admin
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
}

export type AnnouncementStatus = 'upcoming' | 'ongoing' | 'completed';

export interface AnnouncementWithStatus extends Announcement {
  status: AnnouncementStatus;
}