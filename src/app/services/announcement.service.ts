// src/app/services/announcement.service.ts

import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  getDoc
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Observable, from, map } from 'rxjs';
import { Announcement, AnnouncementWithStatus, AnnouncementStatus } from '../models/announcement.model';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  private collectionName = 'announcements';

  constructor(
    private firestore: Firestore,
    private storage: Storage
  ) {
    // Initialize background job for auto-completion
    this.initializeAutoCompletionJob();
  }

  // Calculate status based on 'when' field
  calculateStatus(announcement: Announcement): AnnouncementStatus {
    if (!announcement.when) return 'upcoming';
    
    const now = new Date();
    const dateTimePattern = /(\w+ \d+, \d{4}),?\s*(\d+:\d+\s*[AP]M)?\s*-?\s*(\d+:\d+\s*[AP]M)?/i;
    const match = announcement.when.match(dateTimePattern);
    
    if (!match) return 'upcoming';
    
    const dateStr = match[1];
    const startTime = match[2];
    const endTime = match[3];
    
    try {
      const eventDate = new Date(dateStr);
      
      if (!startTime) {
        // Date only - compare dates
        eventDate.setHours(23, 59, 59, 999);
        return now > eventDate ? 'completed' : 'upcoming';
      }
      
      // Parse start time
      const startDateTime = this.parseDateTime(dateStr, startTime);
      
      if (now < startDateTime) {
        return 'upcoming';
      }
      
      if (endTime) {
        const endDateTime = this.parseDateTime(dateStr, endTime);
        if (now >= startDateTime && now <= endDateTime) {
          return 'ongoing';
        }
        return 'completed';
      }
      
      // No end time, consider ongoing for 2 hours
      const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);
      if (now >= startDateTime && now <= endDateTime) {
        return 'ongoing';
      }
      return 'completed';
      
    } catch (error) {
      console.error('Error parsing date:', error);
      return 'upcoming';
    }
  }

  private parseDateTime(dateStr: string, timeStr: string): Date {
    const date = new Date(dateStr);
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*([AP]M)/i);
    
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const period = timeMatch[3].toUpperCase();
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      date.setHours(hours, minutes, 0, 0);
    }
    
    return date;
  }

  // Add announcement with status
  private addStatusToAnnouncement(announcement: Announcement): AnnouncementWithStatus {
    return {
      ...announcement,
      status: this.calculateStatus(announcement)
    };
  }

  // // Create new announcement
  // async createAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  //   try {
  //     const now = new Date();
  //     const announcementData = {
  //       ...announcement,
  //       createdAt: Timestamp.fromDate(now),
  //       updatedAt: Timestamp.fromDate(now)
  //     };
      
  //     const docRef = await addDoc(collection(this.firestore, this.collectionName), announcementData);
  //     return docRef.id;
  //   } catch (error) {
  //     console.error('Error creating announcement:', error);
  //     throw error;
  //   }
  // }
  // Create new announcement with Base64 image support
async createAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const now = new Date();
    
    // Prepare data for Firestore (remove undefined values)
    const announcementData: any = {
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      priority: announcement.priority,
      isActive: announcement.isActive,
      createdBy: announcement.createdBy,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    };

    // Add optional fields if they exist
    if (announcement.what) announcementData.what = announcement.what;
    if (announcement.when) announcementData.when = announcement.when;
    if (announcement.where) announcementData.where = announcement.where;
    if (announcement.who) announcementData.who = announcement.who;
    if (announcement.why) announcementData.why = announcement.why;
    if (announcement.how) announcementData.how = announcement.how;
    
    // Handle Base64 image - only include if it exists and is not too large
    if (announcement.imageBase64) {
      // Check if Base64 string is reasonable size (optional)
      if (announcement.imageBase64.length < 1000000) { // ~1MB
        announcementData.imageBase64 = announcement.imageBase64;
      } else {
        console.warn('Image too large, skipping Base64 storage');
      }
    }
    
    // Handle legacy imageUrl for backward compatibility
    if (announcement.imageUrl) {
      announcementData.imageUrl = announcement.imageUrl;
    }

    const docRef = await addDoc(collection(this.firestore, this.collectionName), announcementData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
}


  // Get all announcements
  // getAllAnnouncements(): Observable<AnnouncementWithStatus[]> {
  //   return from(
  //     getDocs(query(collection(this.firestore, this.collectionName), orderBy('createdAt', 'desc')))
  //   ).pipe(
  //     map(snapshot => 
  //       snapshot.docs.map(doc => {
  //         const data = doc.data();
  //         const announcement: Announcement = {
  //           id: doc.id,
  //           ...data,
  //           createdAt: data['createdAt']?.toDate(),
  //           updatedAt: data['updatedAt']?.toDate()
  //         } as Announcement;
          
  //         return this.addStatusToAnnouncement(announcement);
  //       })
  //     )
  //   );
  // }
  // Update getAllAnnouncements to handle Base64 images - FIXED VERSION
getAllAnnouncements(): Observable<AnnouncementWithStatus[]> {
  return new Observable<AnnouncementWithStatus[]>(observer => {
    try {
      const announcementsRef = collection(this.firestore, this.collectionName);
      const q = query(announcementsRef, orderBy('createdAt', 'desc'));
      
      // Use getDocs instead of onSnapshot for one-time fetch
      getDocs(q).then((snapshot) => {
        const announcements = snapshot.docs.map(doc => {
          const data = doc.data();
          
          // Handle date conversion safely
          let createdAt: Date;
          let updatedAt: Date;
          
          try {
            createdAt = data['createdAt']?.toDate() || new Date();
            updatedAt = data['updatedAt']?.toDate() || new Date();
          } catch (error) {
            console.warn('Error converting dates for announcement', doc.id, error);
            createdAt = new Date();
            updatedAt = new Date();
          }
          
          const announcement: Announcement = {
            id: doc.id,
            title: data['title'] || '',
            content: data['content'] || '',
            category: data['category'] || 'general',
            what: data['what'] || '',
            when: data['when'] || '',
            where: data['where'] || '',
            who: data['who'] || '',
            why: data['why'] || '',
            how: data['how'] || '',
            priority: data['priority'] || 'medium',
            isActive: data['isActive'] !== undefined ? data['isActive'] : true,
            imageUrl: data['imageUrl'] || '',
            imageBase64: data['imageBase64'] || '', // Add Base64 field
            createdBy: data['createdBy'] || '',
            createdAt: createdAt,
            updatedAt: updatedAt
          };
          
          return this.addStatusToAnnouncement(announcement);
        });
        
        console.log(`Successfully loaded ${announcements.length} announcements`);
        observer.next(announcements);
        observer.complete();
      }).catch((error) => {
        console.error('Error fetching announcements:', error);
        observer.error(error);
      });
      
    } catch (error) {
      console.error('Error in getAllAnnouncements:', error);
      observer.error(error);
    }
  });
}

  // Get announcement by ID
  async getAnnouncementById(id: string): Promise<AnnouncementWithStatus | null> {
    try {
      const docRef = doc(this.firestore, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const announcement: Announcement = {
          id: docSnap.id,
          ...data,
          createdAt: data['createdAt']?.toDate(),
          updatedAt: data['updatedAt']?.toDate()
        } as Announcement;
        
        return this.addStatusToAnnouncement(announcement);
      }
      return null;
    } catch (error) {
      console.error('Error getting announcement:', error);
      throw error;
    }
  }

  // // Update announcement
  // async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<void> {
  //   try {
  //     const docRef = doc(this.firestore, this.collectionName, id);
  //     await updateDoc(docRef, {
  //       ...updates,
  //       updatedAt: Timestamp.fromDate(new Date())
  //     });
  //   } catch (error) {
  //     console.error('Error updating announcement:', error);
  //     throw error;
  //   }
  // }
  // Update announcement with Base64 support
async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<void> {
  try {
    const docRef = doc(this.firestore, this.collectionName, id);
    
    // Prepare update data (remove undefined values)
    const updateData: any = {
      updatedAt: Timestamp.fromDate(new Date())
    };

    // Only include fields that are provided
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    
    // Optional fields
if (updates.what !== undefined) updateData.what = updates.what;
    if (updates.when !== undefined) updateData.when = updates.when;
    if (updates.where !== undefined) updateData.where = updates.where;
    if (updates.who !== undefined) updateData.who = updates.who;
    if (updates.why !== undefined) updateData.why = updates.why;
    if (updates.how !== undefined) updateData.how = updates.how;
    
    // Handle Base64 image
    if (updates.imageBase64 !== undefined) {
      if (updates.imageBase64 && updates.imageBase64.length < 1000000) {
        updateData.imageBase64 = updates.imageBase64;
      } else if (updates.imageBase64 === null || updates.imageBase64 === '') {
        // Remove image if empty string or null
        updateData.imageBase64 = null;
      }
    }
    
    // Handle legacy imageUrl
    if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating announcement:', error);
    throw error;
  }
}

  // Delete announcement
  async deleteAnnouncement(id: string, imageUrl?: string): Promise<void> {
    try {
      // Delete image if exists
      if (imageUrl) {
        await this.deleteImage(imageUrl);
      }
      
      const docRef = doc(this.firestore, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  }

  // Toggle active status
  async toggleActiveStatus(id: string, isActive: boolean): Promise<void> {
    try {
      await this.updateAnnouncement(id, { isActive });
    } catch (error) {
      console.error('Error toggling status:', error);
      throw error;
    }
  }

  // Upload image
  async uploadImage(file: File, announcementId: string): Promise<string> {
    try {
      const timestamp = new Date().getTime();
      const filePath = `announcements/${announcementId}_${timestamp}`;
      const storageRef = ref(this.storage, filePath);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Delete image
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const imageRef = ref(this.storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw - image might already be deleted
    }
  }

  // Background job - Auto-complete expired announcements
  private initializeAutoCompletionJob() {
    // Run every hour
    setInterval(() => {
      this.autoCompleteExpiredAnnouncements();
    }, 60 * 60 * 1000);
    
    // Run on initialization
    this.autoCompleteExpiredAnnouncements();
  }

  private async autoCompleteExpiredAnnouncements() {
    try {
      const snapshot = await getDocs(
        query(collection(this.firestore, this.collectionName), where('isActive', '==', true))
      );
      
      const now = new Date();
      const gracePeriod = 24 * 60 * 60 * 1000; // 24 hours
      
      snapshot.docs.forEach(async (document) => {
        const data = document.data();
        const announcement: Announcement = {
          id: document.id,
          ...data,
          createdAt: data['createdAt']?.toDate(),
          updatedAt: data['updatedAt']?.toDate()
        } as Announcement;
        
        const status = this.calculateStatus(announcement);
        
        if (status === 'completed') {
          // Calculate if grace period has passed
          const endTime = this.getEndTime(announcement);
          if (endTime && (now.getTime() - endTime.getTime()) > gracePeriod) {
            // Auto-deactivate
            await this.toggleActiveStatus(document.id, false);
            console.log(`Auto-deactivated announcement: ${announcement.title}`);
          }
        }
      });
    } catch (error) {
      console.error('Error in auto-completion job:', error);
    }
  }

  private getEndTime(announcement: Announcement): Date | null {
    if (!announcement.when) return null;
    
    const dateTimePattern = /(\w+ \d+, \d{4}),?\s*(\d+:\d+\s*[AP]M)?\s*-?\s*(\d+:\d+\s*[AP]M)?/i;
    const match = announcement.when.match(dateTimePattern);
    
    if (!match) return null;
    
    const dateStr = match[1];
    const endTime = match[3];
    
    if (endTime) {
      return this.parseDateTime(dateStr, endTime);
    }
    
    return null;
  }

  // Filter announcements
  filterAnnouncements(
    announcements: AnnouncementWithStatus[], 
    filters: {
      category?: string;
      priority?: string;
      status?: AnnouncementStatus;
      isActive?: boolean;
    }
  ): AnnouncementWithStatus[] {
    return announcements.filter(announcement => {
      if (filters.category && announcement.category !== filters.category) return false;
      if (filters.priority && announcement.priority !== filters.priority) return false;
      if (filters.status && announcement.status !== filters.status) return false;
      if (filters.isActive !== undefined && announcement.isActive !== filters.isActive) return false;
      return true;
    });
  }
}