// import { Injectable, inject, signal } from '@angular/core';
// import { Firestore, collection, collectionData, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
// import { Observable, map, tap } from 'rxjs';

// export interface FirebaseUser {
//   id: string;
//   barangay: string;
//   createdAt: any;
//   displayName: string;
//   email: string;
//   location: {
//     latitude: number;
//     longitude: number;
//   };
//   phoneNumber: string;
//   role: string;
//   status: string;
//   uid: string;
//   updatedAt: any;
// }

// interface UserManagementState {
//   users: FirebaseUser[];
//   loading: boolean;
//   selectedUser: FirebaseUser | null;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class UserManagementService {
//   private firestore = inject(Firestore);
  
//   // Using signals for state management
//   private state = signal<UserManagementState>({
//     users: [],
//     loading: false,
//     selectedUser: null
//   });

//   // Public readonly state
//   readonly users = () => this.state().users;
//   readonly loading = () => this.state().loading;
//   readonly selectedUser = () => this.state().selectedUser;

//   loadUsers(): Observable<FirebaseUser[]> {
//     this.state.update(state => ({ ...state, loading: true }));
    
//     const usersCollection = collection(this.firestore, 'users');
//     const users$ = collectionData(usersCollection, { idField: 'id' }) as Observable<FirebaseUser[]>;
    
//     return users$.pipe(
//       tap(users => {
//         this.state.update(state => ({
//           ...state,
//           users,
//           loading: false
//         }));
//       })
//     );
//   }

//   updateUserStatus(userId: string, newStatus: 'approved' | 'rejected') {
//     const userDoc = doc(this.firestore, 'users', userId);
//     return updateDoc(userDoc, {
//       status: newStatus,
//       updatedAt: new Date()
//     });
//   }

//   deleteUser(userId: string) {
//     const userDoc = doc(this.firestore, 'users', userId);
//     return deleteDoc(userDoc);
//   }

//   setSelectedUser(user: FirebaseUser | null) {
//     this.state.update(state => ({ ...state, selectedUser: user }));
//   }
// }

import { Injectable, inject, signal } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable, from, tap } from 'rxjs';

export interface FirebaseUser {
  id: string;
  barangay: string;
  sitio: string;
  createdAt: any;
  displayName: string;
  email: string;
  location: {
    latitude: number;
    longitude: number;
  };
  phoneNumber: string;
  role: string;
  status: string;
  uid: string;
  updatedAt: any;
}

interface UserManagementState {
  users: FirebaseUser[];
  loading: boolean;
  selectedUser: FirebaseUser | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private firestore = inject(Firestore);
  
  // Using signals for state management
  private state = signal<UserManagementState>({
    users: [],
    loading: false,
    selectedUser: null
  });

  // Public readonly state
  readonly users = () => this.state().users;
  readonly loading = () => this.state().loading;
  readonly selectedUser = () => this.state().selectedUser;

  loadUsers(): Observable<FirebaseUser[]> {
    this.state.update(state => ({ ...state, loading: true }));
    
    const usersCollection = collection(this.firestore, 'users');
    const users$ = collectionData(usersCollection, { idField: 'id' }) as Observable<FirebaseUser[]>;
    
    return users$.pipe(
      tap(users => {
        this.state.update(state => ({ 
          ...state, 
          users, 
          loading: false 
        }));
      })
    );
  }

  updateUserStatus(userId: string, newStatus: 'approved' | 'rejected'): Observable<void> {
    const userDoc = doc(this.firestore, 'users', userId);
    
    return from(updateDoc(userDoc, { 
      status: newStatus, 
      updatedAt: new Date() 
    })).pipe(
      tap(() => {
        // Update local state optimistically
        const updatedUsers = this.state().users.map(user => 
          user.id === userId ? { ...user, status: newStatus, updatedAt: new Date() } : user
        );
        this.state.update(state => ({ ...state, users: updatedUsers }));
      })
    );
  }

  // NEW: Update user method
  updateUser(userId: string, userData: Partial<FirebaseUser>): Observable<void> {
    const userDoc = doc(this.firestore, 'users', userId);
    
    return from(updateDoc(userDoc, { 
      ...userData,
      updatedAt: new Date() 
    })).pipe(
      tap(() => {
        // Update local state optimistically
        const updatedUsers = this.state().users.map(user => 
          user.id === userId ? { ...user, ...userData, updatedAt: new Date() } : user
        );
        this.state.update(state => ({ ...state, users: updatedUsers }));
      })
    );
  }

  deleteUser(userId: string): Observable<void> {
    const userDoc = doc(this.firestore, 'users', userId);
    
    return from(deleteDoc(userDoc)).pipe(
      tap(() => {
        // Update local state
        const updatedUsers = this.state().users.filter(user => user.id !== userId);
        this.state.update(state => ({ ...state, users: updatedUsers }));
      })
    );
  }

  setSelectedUser(user: FirebaseUser | null) {
    this.state.update(state => ({ ...state, selectedUser: user }));
  }

  // Helper method to check if user is non-admin (resident or other roles)
  isNonAdminUser(user: FirebaseUser): boolean {
    return user.role !== 'admin';
  }
}