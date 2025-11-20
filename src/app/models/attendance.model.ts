export interface Attendance {
  id?: string;
  eventId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userBarangay: string;
  rsvpStatus: 'will_attend' | 'not_attending' | 'pending';
  actualAttendance: 'present' | 'absent' | 'not_recorded';
  respondedAt: Date;
  confirmedAt?: Date; // When user confirmed actual attendance
  notes?: string;
}