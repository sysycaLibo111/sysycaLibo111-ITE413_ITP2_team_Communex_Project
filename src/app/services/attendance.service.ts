// services/attendance.service.ts
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where,
  Timestamp 
} from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
import { Attendance } from '../models/attendance.model';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private get attendanceCollection() {
    return collection(this.firestore, 'attendance');
  }

  // RSVP for an event
  async rsvpToEvent(eventId: string, rsvpStatus: 'will_attend' | 'not_attending'): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be logged in to RSVP');
    }

    try {
      // Check if user already RSVP'd
      const existingRSVP = await this.getUserRSVP(eventId, currentUser.uid);
      
      if (existingRSVP) {
        // Update existing RSVP
        const docRef = doc(this.firestore, 'attendance', existingRSVP.id!);
        await updateDoc(docRef, {
          rsvpStatus,
          respondedAt: Timestamp.now()
        });
      } else {
        // Create new RSVP
        const attendance: Omit<Attendance, 'id'> = {
          eventId,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          userName: currentUser.displayName,
          userBarangay: currentUser.barangay,
          rsvpStatus,
          actualAttendance: 'not_recorded',
          respondedAt: new Date()
        };

        await addDoc(this.attendanceCollection, attendance);
      }
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      throw error;
    }
  }

  // Confirm actual attendance after event
  async confirmAttendance(eventId: string): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be logged in to confirm attendance');
    }

    try {
      const existingRSVP = await this.getUserRSVP(eventId, currentUser.uid);
      
      if (existingRSVP) {
        const docRef = doc(this.firestore, 'attendance', existingRSVP.id!);
        await updateDoc(docRef, {
          actualAttendance: 'present',
          confirmedAt: Timestamp.now()
        });
      } else {
        throw new Error('No RSVP found for this event');
      }
    } catch (error) {
      console.error('Error confirming attendance:', error);
      throw error;
    }
  }

  // Get user's RSVP for an event
  async getUserRSVP(eventId: string, userId: string): Promise<Attendance | null> {
    try {
      const q = query(
        this.attendanceCollection,
        where('eventId', '==', eventId),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          respondedAt: data['respondedAt']?.toDate(),
          confirmedAt: data['confirmedAt']?.toDate()
        } as Attendance;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user RSVP:', error);
      throw error;
    }
  }

  // Get all attendance for an event
  async getEventAttendance(eventId: string): Promise<Attendance[]> {
    try {
      const q = query(
        this.attendanceCollection,
        where('eventId', '==', eventId)
      );

      const querySnapshot = await getDocs(q);
      const attendance: Attendance[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        attendance.push({
          id: doc.id,
          ...data,
          respondedAt: data['respondedAt']?.toDate(),
          confirmedAt: data['confirmedAt']?.toDate()
        } as Attendance);
      });

      return attendance;
    } catch (error) {
      console.error('Error fetching event attendance:', error);
      throw error;
    }
  }

  // Get attendance count for an event
  async getEventAttendanceCount(eventId: string): Promise<{ willAttend: number; notAttending: number; confirmed: number }> {
    try {
      const attendance = await this.getEventAttendance(eventId);
      
      return {
        willAttend: attendance.filter(a => a.rsvpStatus === 'will_attend').length,
        notAttending: attendance.filter(a => a.rsvpStatus === 'not_attending').length,
        confirmed: attendance.filter(a => a.actualAttendance === 'present').length
      };
    } catch (error) {
      console.error('Error counting attendance:', error);
      throw error;
    }
  }
}