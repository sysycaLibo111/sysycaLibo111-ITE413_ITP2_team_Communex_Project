// services/event.service.ts
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
Timestamp,
  
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { AuthService } from '../auth/auth.service';
import { Event } from '../models/event.model';
import { AttendanceService } from './attendance.service';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private authService = inject(AuthService);
  private attendanceService = inject(AttendanceService);

  private get eventsCollection() {
    return collection(this.firestore, 'events');
  }

  // Create new event with image upload
  async createEvent(
    eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'imageUrl'>, 
    imageFile?: File
  ): Promise<string> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only administrators can create events');
    }

    try {
      let imageUrl = '';
      
      // Upload image if provided
      if (imageFile) {
        imageUrl = await this.uploadImage(imageFile, 'events');
      }

      const event: Omit<Event, 'id'> = {
        ...eventData,
        imageUrl,
        status: 'upcoming',
        createdBy: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(this.eventsCollection, event);
      return docRef.id;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  // Get all events with optional filters
  async getEvents(filters?: {
    status?: Event['status'];
    barangay?: string;
    limit?: number;
  }): Promise<Event[]> {
    try {
      let q = query(this.eventsCollection, orderBy('when', 'asc'));

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      // If barangay filter is provided
      if (filters?.barangay) {
        q = query(q, where('who', '==', filters.barangay));
      }

      // If limit is provided
      if (filters?.limit) {
        // Note: Firestore doesn't support limit with orderBy on different fields without index
        // We'll handle limit in code for now
      }

      const querySnapshot = await getDocs(q);
      const events: Event[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        events.push({
          id: doc.id,
          ...data,
          when: data['when']?.toDate(),
          createdAt: data['createdAt']?.toDate(),
          updatedAt: data['updatedAt']?.toDate()
        } as Event);
      });

      // Apply limit in code if specified
      if (filters?.limit) {
        return events.slice(0, filters.limit);
      }

      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  // Get event by ID
  async getEventById(id: string): Promise<Event | null> {
    try {
      const docRef = doc(this.firestore, 'events', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          when: data['when']?.toDate(),
          createdAt: data['createdAt']?.toDate(),
          updatedAt: data['updatedAt']?.toDate()
        } as Event;
      }
      return null;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  }

  // Get event by ID with attendance statistics
  async getEventWithStats(id: string): Promise<{ 
    event: Event; 
    attendanceStats: { willAttend: number; notAttending: number; confirmed: number } 
  } | null> {
    try {
      const event = await this.getEventById(id);
      if (!event) return null;

      const attendanceStats = await this.attendanceService.getEventAttendanceCount(id);
      
      return { event, attendanceStats };
    } catch (error) {
      console.error('Error fetching event with stats:', error);
      throw error;
    }
  }

  // Update event
  async updateEvent(
    id: string, 
    updates: Partial<Event>, 
    imageFile?: File
  ): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only administrators can update events');
    }

    try {
      const updateData: any = {
        ...updates,
        updatedAt: new Date()
      };

      // Upload new image if provided
      if (imageFile) {
        updateData.imageUrl = await this.uploadImage(imageFile, 'events');
      }

      const docRef = doc(this.firestore, 'events', id);
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  // Mark event as completed
  async markEventAsCompleted(eventId: string): Promise<void> {
    await this.updateEvent(eventId, { status: 'completed' });
  }

  // Delete event
  async deleteEvent(id: string): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only administrators can delete events');
    }

    try {
      const docRef = doc(this.firestore, 'events', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  // Get upcoming events (convenience method)
  async getUpcomingEvents(limit?: number): Promise<Event[]> {
    return this.getEvents({ status: 'upcoming', limit });
  }

  // Get completed events (convenience method)
  async getCompletedEvents(limit?: number): Promise<Event[]> {
    return this.getEvents({ status: 'completed', limit });
  }

  // Upload image to Firebase Storage
  private async uploadImage(file: File, folder: string): Promise<string> {
    const filePath = `${folder}/${Date.now()}_${file.name}`;
    const storageRef = ref(this.storage, filePath);
    
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }
}