// // auth/auth.service.ts
// import { Injectable, NgZone, inject } from '@angular/core';
// import {
//   Auth,
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   signOut,
//   User as FirebaseUser
// } from '@angular/fire/auth';
// import {
//   Firestore,
//   doc,
//   setDoc,
//   getDoc,
//   updateDoc,
//   collection,
//   query,
//   where,
//   getDocs
// } from '@angular/fire/firestore';
// import { Router } from '@angular/router';
// import { BehaviorSubject, Observable } from 'rxjs';

// export interface User {
//   uid: string;
//   email: string;
//   displayName: string;
//   role: 'resident' | 'barangay_staff' | 'lgu' | 'admin';
//   status: 'pending' | 'approved' | 'rejected';
//   phoneNumber?: string;
//   barangay: string;
//   location?: {
//     latitude: number;
//     longitude: number;
//   };
//   createdAt: Date;
//   updatedAt: Date;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {
//   private currentUserSubject = new BehaviorSubject<User | null>(null);
//   public currentUser$ = this.currentUserSubject.asObservable();
//   private userDataCache = new Map<string, User>();
//   private isInitialized = false;
//   private ngZone = inject(NgZone);
  
//   constructor(
//     private auth: Auth,
//     private firestore: Firestore,
//     private router: Router
//   ) {
//     this.initializeAuthState();
//   }

//   private initializeAuthState(): void {
//     // Run auth state changes inside NgZone to avoid context issues
//     this.ngZone.runOutsideAngular(() => {
//       this.auth.onAuthStateChanged(async (firebaseUser) => {
//         // Run the actual logic inside NgZone
//         this.ngZone.run(async () => {
//           if (firebaseUser) {
//             console.log('Auth state changed - User logged in:', firebaseUser.uid);
//             await this.handleUserLogin(firebaseUser);
//           } else {
//             console.log('Auth state changed - User logged out');
//             this.currentUserSubject.next(null);
//             this.userDataCache.clear();
//           }
//           this.isInitialized = true;
//         });
//       });
//     });
//   }

//   private async handleUserLogin(firebaseUser: FirebaseUser): Promise<void> {
//     try {
//       // Check if we already have the current user
//       if (!this.currentUserSubject.value || this.currentUserSubject.value.uid !== firebaseUser.uid) {
//         const userData = await this.getUserData(firebaseUser.uid);
//         if (userData) {
//           this.currentUserSubject.next(userData);
//         } else {
//           console.warn('User data not found for uid:', firebaseUser.uid);
//           await signOut(this.auth);
//           throw new Error('User account data not found. Please contact administrator.');
//         }
//       }
//     } catch (error) {
//       console.error('Error handling user login:', error);
//       throw error;
//     }
//   }

//   // Check if email already exists in Firestore
//   async checkEmailExists(email: string): Promise<boolean> {
//     try {
//       const normalizedEmail = email.toLowerCase().trim();
//       const usersRef = collection(this.firestore, 'users');
//       const emailQuery = query(usersRef, where('email', '==', normalizedEmail));
//       const querySnapshot = await getDocs(emailQuery);
//       return !querySnapshot.empty;
//     } catch (error) {
//       console.error('Error checking email existence:', error);
//       return false;
//     }
//   }

//   // Check if admin already exists
//   async checkAdminExists(): Promise<boolean> {
//     try {
//       const usersRef = collection(this.firestore, 'users');
//       const adminQuery = query(usersRef, where('role', '==', 'admin'));
//       const querySnapshot = await getDocs(adminQuery);
//       return !querySnapshot.empty;
//     } catch (error) {
//       console.error('Error checking admin existence:', error);
//       return false;
//     }
//   }

//   // Register new user - UPDATED WITH BETTER ERROR HANDLING
//   async register(
//     email: string,
//     password: string,
//     displayName: string,
//     role: 'resident' | 'barangay_staff' | 'lgu' | 'admin' = 'resident',
//     additionalData?: {
//       phoneNumber?: string;
//       barangay: string;
//       location?: { latitude: number; longitude: number };
//     }
//   ): Promise<{success: boolean; message: string}> {
//     let userCredential: any = null;
    
//     try {
//       const normalizedEmail = email.toLowerCase().trim();

//       console.log('Starting registration for:', normalizedEmail);

//       // Check if email already exists in Firestore
//       const emailExists = await this.checkEmailExists(normalizedEmail);
//       if (emailExists) {
//         return {
//           success: false,
//           message: 'This email address is already registered. Please use a different email or try logging in.'
//         };
//       }

//       // Check if admin already exists
//       if (role === 'admin') {
//         const adminExists = await this.checkAdminExists();
//         if (adminExists) {
//           return {
//             success: false,
//             message: 'An administrator account already exists in the system.'
//           };
//         }
//       }

//       console.log('Creating Firebase Auth user...');
//       // Create user in Firebase Auth
//       userCredential = await createUserWithEmailAndPassword(
//         this.auth,
//         normalizedEmail,
//         password
//       );

//       console.log('Firebase Auth user created:', userCredential.user.uid);

//       // Determine initial status based on role
//       const status = role === 'resident' ? 'approved' : 'pending';

//       const user: User = {
//         uid: userCredential.user.uid,
//         email: normalizedEmail,
//         displayName: displayName.trim(),
//         role: role,
//         status: status,
//         phoneNumber: additionalData?.phoneNumber?.trim(),
//         barangay: additionalData?.barangay || '',
//         location: additionalData?.location,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       };

//       console.log('Saving user data to Firestore:', user);
//       // Save to Firestore
//       await this.saveUserToFirestore(user);

//       console.log('User registration completed successfully');
      
//       // Sign out immediately after registration
//       await signOut(this.auth);
//       this.currentUserSubject.next(null);

//       return {
//         success: true,
//         message: role === 'resident'
//           ? 'Your resident account has been created successfully. You can now log in.'
//           : `Your ${this.getRoleDisplayName(role)} account has been created. Please wait for admin approval before logging in.`
//       };
      
//     } catch (error: any) {
//       console.error('Registration error:', error);
      
//       // Clean up: If Firebase user was created but Firestore failed, delete the auth user
//       if (userCredential?.user) {
//         try {
//           console.log('Cleaning up: Deleting Firebase Auth user due to failure');
//           await userCredential.user.delete();
//         } catch (deleteError) {
//           console.error('Error deleting Firebase user during cleanup:', deleteError);
//         }
//       }
      
//       let errorMessage = 'Registration failed. Please try again.';
      
//       if (error.code === 'auth/email-already-in-use') {
//         errorMessage = 'This email address is already registered. Please use a different email or try logging in.';
//       } else if (error.code === 'auth/invalid-email') {
//         errorMessage = 'The email address is not valid. Please check and try again.';
//       } else if (error.code === 'auth/operation-not-allowed') {
//         errorMessage = 'Email/password accounts are not enabled. Please contact support.';
//       } else if (error.code === 'auth/weak-password') {
//         errorMessage = 'The password is too weak. Please use a stronger password.';
//       } else if (error.code === 'auth/network-request-failed') {
//         errorMessage = 'Network error. Please check your internet connection and try again.';
//       } else {
//         errorMessage = error.message || errorMessage;
//       }
      
//       return {
//         success: false,
//         message: errorMessage
//       };
//     }
//   }

//   private async saveUserToFirestore(user: User): Promise<void> {
//     try {
//       await setDoc(doc(this.firestore, 'users', user.uid), user);
//       console.log('User data saved to Firestore successfully');
      
//       // Verify the document was created
//       const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
//       if (!userDoc.exists()) {
//         throw new Error('Failed to verify user document creation');
//       }
//       console.log('User document verified in Firestore');
//     } catch (error) {
//       console.error('Error saving user to Firestore:', error);
//       throw error;
//     }
//   }

//   // Get user data from Firestore
//   async getUserData(uid: string): Promise<User | null> {
//     // Check cache first
//     if (this.userDataCache.has(uid)) {
//       return this.userDataCache.get(uid)!;
//     }
    
//     try {
//       console.log('Fetching user data from Firestore for uid:', uid);
//       const userDoc = await getDoc(doc(this.firestore, 'users', uid));
      
//       if (userDoc.exists()) {
//         const userData = userDoc.data() as User;
//         console.log('User data found:', userData);
//         this.userDataCache.set(uid, userData);
//         return userData;
//       } else {
//         console.warn('User document does not exist in Firestore for uid:', uid);
//         return null;
//       }
//     } catch (error: any) {
//       console.error('Error getting user data:', error);
//       if (error.code === 'unavailable') {
//         throw new Error('Unable to connect to database. Please check your internet connection.');
//       }
//       return null;
//     }
//   }

//   // Login with role and status check
//   async login(email: string, password: string): Promise<void> {
//     try {
//       const normalizedEmail = email.toLowerCase().trim();
      
//       const userCredential = await signInWithEmailAndPassword(
//         this.auth,
//         normalizedEmail,
//         password
//       );
      
//       console.log('User signed in, fetching user data...');
//       // Fetch user data
//       const userData = await this.getUserData(userCredential.user.uid);
      
//       if (!userData) {
//         await signOut(this.auth);
//         throw new Error('User account data not found. Please contact administrator.');
//       }

//       // Check if account is pending approval
//       if (userData.status === 'pending') {
//         await signOut(this.auth);
//         throw new Error(
//           'Your account is pending approval from the Admin. Please wait for verification before logging in.'
//         );
//       }

//       // Check if account is rejected
//       if (userData.status === 'rejected') {
//         await signOut(this.auth);
//         throw new Error(
//           'Your account has been rejected. Please contact the administrator for more information.'
//         );
//       }
      
//       // Cache and set current user
//       this.userDataCache.set(userData.uid, userData);
//       this.currentUserSubject.next(userData);
      
//       console.log('User logged in successfully, routing to dashboard...');
//       // Route based on role
//       this.routeToRoleDashboard(userData.role);
//     } catch (error: any) {
//       console.error('Login error:', error);
//       // Enhance error messages
//       if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
//         throw new Error('Invalid email or password. Please try again.');
//       }
//       if (error.code === 'auth/user-not-found') {
//         throw new Error('No account found with this email. Please check your email or register.');
//       }
//       if (error.code === 'auth/too-many-requests') {
//         throw new Error('Too many failed login attempts. Please try again later.');
//       }
//       if (error.code === 'auth/network-request-failed') {
//         throw new Error('Network error. Please check your internet connection and try again.');
//       }
//       throw error;
//     }
//   }

//   // Helper method for role display names
//   private getRoleDisplayName(role: string): string {
//     const roleMap: { [key: string]: string } = {
//       'resident': 'Resident',
//       'barangay_staff': 'Barangay Staff',
//       'lgu': 'LGU Officer',
//       'admin': 'Administrator'
//     };
//     return roleMap[role] || role;
//   }

//   // ... rest of your methods (logout, updateUserProfile, etc.) remain the same

//   // Logout
//   async logout(): Promise<void> {
//     try {
//       await signOut(this.auth);
//       this.currentUserSubject.next(null);
//       this.userDataCache.clear();
//       this.router.navigate(['/login']);
//     } catch (error: any) {
//       console.error('Logout error:', error);
//       throw new Error(error.message);
//     }
//   }

//   // Update user profile
//   async updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
//     try {
//       const userRef = doc(this.firestore, 'users', uid);
//       await updateDoc(userRef, {
//         ...data,
//         updatedAt: new Date()
//       });

//       const updatedUser = await this.getUserData(uid);
//       this.currentUserSubject.next(updatedUser);
//     } catch (error: any) {
//       throw new Error(error.message);
//     }
//   }

//   // Route to appropriate dashboard
//   private routeToRoleDashboard(role: string): void {
//     switch (role) {
//       case 'admin':
//         this.router.navigate(['/admin-dashboard']);
//         break;
//       case 'barangay_staff':
//         this.router.navigate(['/barangay-dashboard']);
//         break;
//       case 'lgu':
//         this.router.navigate(['/lgu-dashboard']);
//         break;
//       case 'resident':
//         this.router.navigate(['/resident-dashboard']);
//         break;
//       default:
//         this.router.navigate(['/login']);
//     }
//   }

//   // Get current user
//   getCurrentUser(): User | null {
//     return this.currentUserSubject.value;
//   }

//   // Check if user is logged in
//   isLoggedIn(): boolean {
//     return this.currentUserSubject.value !== null;
//   }

//   // Check if user has specific role
//   hasRole(role: string): boolean {
//     const user = this.currentUserSubject.value;
//     return user ? user.role === role : false;
//   }

//   // Check if user is approved
//   isApproved(): boolean {
//     const user = this.currentUserSubject.value;
//     return user ? user.status === 'approved' : false;
//   }
// }


// 2nd

// auth/auth.service.ts
import { Injectable, NgZone, inject } from '@angular/core';
import { 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from '@angular/fire/auth';
import { 
  Firestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from '@angular/fire/firestore';
import { 
  Storage,
  ref,
  uploadBytes,
  getDownloadURL
} from '@angular/fire/storage';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'resident' | 'barangay_staff' | 'lgu' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  phoneNumber?: string;
  barangay: string;
  sitio: string;
  profileImageBase64?: string; 
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private userDataCache = new Map<string, User>();
  private isInitialized = false;
  private ngZone = inject(NgZone);
  
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private storage: Storage,
    private router: Router
  ) {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    this.ngZone.runOutsideAngular(() => {
      this.auth.onAuthStateChanged(async (firebaseUser) => {
        this.ngZone.run(async () => {
          if (firebaseUser) {
            console.log('Auth state changed - User logged in:', firebaseUser.uid);
            await this.handleUserLogin(firebaseUser);
          } else {
            console.log('Auth state changed - User logged out');
            this.currentUserSubject.next(null);
            this.userDataCache.clear();
          }
          this.isInitialized = true;
        });
      });
    });
  }

  private async handleUserLogin(firebaseUser: FirebaseUser): Promise<void> {
    try {
      if (!this.currentUserSubject.value || this.currentUserSubject.value.uid !== firebaseUser.uid) {
        const userData = await this.getUserData(firebaseUser.uid);
        if (userData) {
          this.currentUserSubject.next(userData);
        } else {
          console.warn('User data not found for uid:', firebaseUser.uid);
          await signOut(this.auth);
          throw new Error('User account data not found. Please contact administrator.');
        }
      }
    } catch (error) {
      console.error('Error handling user login:', error);
      throw error;
    }
  }

  // Check if email already exists in Firestore
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const usersRef = collection(this.firestore, 'users');
      const emailQuery = query(usersRef, where('email', '==', normalizedEmail));
      const querySnapshot = await getDocs(emailQuery);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false;
    }
  }

  // Check if admin already exists
  async checkAdminExists(): Promise<boolean> {
    try {
      const usersRef = collection(this.firestore, 'users');
      const adminQuery = query(usersRef, where('role', '==', 'admin'));
      const querySnapshot = await getDocs(adminQuery);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking admin existence:', error);
      return false;
    }
  }
// Update the register method in auth.service.ts
async register(
  email: string, 
  password: string, 
  displayName: string,
  role: 'resident' | 'barangay_staff' | 'lgu' | 'admin' = 'resident',
  additionalData?: {
    phoneNumber?: string;
    barangay: string;
    sitio: string;
    location?: { latitude: number; longitude: number };
    profileImageBase64?: string; // Change from File to Base64 string
  }
): Promise<{success: boolean; message: string}> {
  let userCredential: any = null;
  
  try {
    const normalizedEmail = email.toLowerCase().trim();

    console.log('Starting registration for:', normalizedEmail);

    // Check if email already exists
    const emailExists = await this.checkEmailExists(normalizedEmail);
    if (emailExists) {
      return {
        success: false,
        message: 'This email address is already registered. Please use a different email or try logging in.'
      };
    }

    // Check if admin already exists
    if (role === 'admin') {
      const adminExists = await this.checkAdminExists();
      if (adminExists) {
        return {
          success: false,
          message: 'An administrator account already exists in the system.'
        };
      }
    }

    console.log('Creating Firebase Auth user...');
    // Create user in Firebase Auth
    userCredential = await createUserWithEmailAndPassword(
      this.auth, 
      normalizedEmail, 
      password
    );

    console.log('Firebase Auth user created:', userCredential.user.uid);

    // Determine initial status based on role
    const status = role === 'resident' ? 'approved' : 'pending';

    const user: User = {
      uid: userCredential.user.uid,
      email: normalizedEmail,
      displayName: displayName.trim(),
      role: role,
      status: status,
      phoneNumber: additionalData?.phoneNumber?.trim(),
      barangay: additionalData?.barangay || '',
      sitio: additionalData?.sitio || '',
      profileImageBase64: additionalData?.profileImageBase64 || undefined, // Store Base64 string
      location: additionalData?.location,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Saving user data to Firestore:', user);
    // Save to Firestore
    await this.saveUserToFirestore(user);

    console.log('User registration completed successfully');
    
    // Sign out immediately after registration
    await signOut(this.auth);
    this.currentUserSubject.next(null);

    return {
      success: true,
      message: role === 'resident' 
        ? 'Your resident account has been created successfully. You can now log in.'
        : `Your ${this.getRoleDisplayName(role)} account has been created. Please wait for admin approval before logging in.`
    };
    
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Clean up: If Firebase user was created but Firestore failed, delete the auth user
    if (userCredential?.user) {
      try {
        console.log('Cleaning up: Deleting Firebase Auth user due to failure');
        await userCredential.user.delete();
      } catch (deleteError) {
        console.error('Error deleting Firebase user during cleanup:', deleteError);
      }
    }
    
    let errorMessage = 'Registration failed. Please try again.';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email address is already registered. Please use a different email or try logging in.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'The email address is not valid. Please check and try again.';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Email/password accounts are not enabled. Please contact support.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'The password is too weak. Please use a stronger password.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    } else {
      errorMessage = error.message || errorMessage;
    }
    
    return {
      success: false,
      message: errorMessage
    };
  }
}


  private async saveUserToFirestore(user: User): Promise<void> {
    try {
      await setDoc(doc(this.firestore, 'users', user.uid), user);
      console.log('User data saved to Firestore successfully');
      
      // Verify the document was created
      const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('Failed to verify user document creation');
      }
      console.log('User document verified in Firestore');
    } catch (error) {
      console.error('Error saving user to Firestore:', error);
      throw error;
    }
  }

  // Get user data from Firestore
  async getUserData(uid: string): Promise<User | null> {
    // Check cache first
    if (this.userDataCache.has(uid)) {
      return this.userDataCache.get(uid)!;
    }
    
    try {
      console.log('Fetching user data from Firestore for uid:', uid);
      const userDoc = await getDoc(doc(this.firestore, 'users', uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        console.log('User data found:', userData);
        this.userDataCache.set(uid, userData);
        return userData;
      } else {
        console.warn('User document does not exist in Firestore for uid:', uid);
        return null;
      }
    } catch (error: any) {
      console.error('Error getting user data:', error);
      if (error.code === 'unavailable') {
        throw new Error('Unable to connect to database. Please check your internet connection.');
      }
      return null;
    }
  }

  // Login with role and status check
  async login(email: string, password: string): Promise<void> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      const userCredential = await signInWithEmailAndPassword(
        this.auth, 
        normalizedEmail, 
        password
      );
      
      console.log('User signed in, fetching user data...');
      // Fetch user data
      const userData = await this.getUserData(userCredential.user.uid);
      
      if (!userData) {
        await signOut(this.auth);
        throw new Error('User account data not found. Please contact administrator.');
      }

      // Check if account is pending approval
      if (userData.status === 'pending') {
        await signOut(this.auth);
        throw new Error(
          'Your account is pending approval from the Admin. Please wait for verification before logging in.'
        );
      }

      // Check if account is rejected
      if (userData.status === 'rejected') {
        await signOut(this.auth);
        throw new Error(
          'Your account has been rejected. Please contact the administrator for more information.'
        );
      }
      
      // Cache and set current user
      this.userDataCache.set(userData.uid, userData);
      this.currentUserSubject.next(userData);
      
      console.log('User logged in successfully, routing to dashboard...');
      // Route based on role
      this.routeToRoleDashboard(userData.role);
    } catch (error: any) {
      console.error('Login error:', error);
      // Enhance error messages
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password. Please try again.');
      }
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email. Please check your email or register.');
      }
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      }
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  // Helper method for role display names
  private getRoleDisplayName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'resident': 'Resident',
      'barangay_staff': 'Barangay Staff',
      'lgu': 'LGU Officer',
      'admin': 'Administrator'
    };
    return roleMap[role] || role;
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUserSubject.next(null);
      this.userDataCache.clear();
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message);
    }
  }

  // Update user profile
  async updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
    try {
      const userRef = doc(this.firestore, 'users', uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date()
      });

      const updatedUser = await this.getUserData(uid);
      this.currentUserSubject.next(updatedUser);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Update user profile with image
 

  // Route to appropriate dashboard
  private routeToRoleDashboard(role: string): void {
    switch (role) {
      case 'admin':
        this.router.navigate(['/admin-dashboard']);
        break;
      case 'barangay_staff':
        this.router.navigate(['/barangay-dashboard']);
        break;
      case 'lgu':
        this.router.navigate(['/lgu-dashboard']);
        break;
      case 'resident':
        this.router.navigate(['/resident-dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user ? user.role === role : false;
  }

  // Check if user is approved
  isApproved(): boolean {
    const user = this.currentUserSubject.value;
    return user ? user.status === 'approved' : false;
  }
}