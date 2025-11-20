// export interface Event {
//   id?: string;
//   title: string;
//   description: string;
//   // 5W1H Format
//   what: string;
//   when: Date; // Event date and time
//   where: string;
//   who: string; // Organizer
//   why: string;
//   how: string; // How to participate
//   imageUrl?: string;
//   createdBy: string;
//   createdAt: Date;
//   updatedAt: Date;
//   status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
//   maxAttendees?: number;
//   isRegistrationRequired: boolean;
// }
// models/event.model.ts
export interface Event {
  id?: string;
  title: string;
  description: string;
  // 5W1H Format
  what: string;
  when: Date; // Event date and time
  where: string;
  who: string; // Organizer
  why: string;
  how: string; // How to participate
  imageUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  maxAttendees?: number;
  isRegistrationRequired: boolean;
}