# Project Rebuild - Simple Admin & User System

## Changes Made

### 1. **Simplified Structure**
- Removed: seller, customer, courses, products, orders, cart, campus zones
- Kept: Admin and User roles only
- Two dashboards: Admin Dashboard & User Dashboard

### 2. **Dependencies Removed**
- `@ionic/storage-angular` - No local storage (not free tier compatible)
- `chart.js` and `ng2-charts` - Removed analytics/charts
- `swiper` - Removed unnecessary carousel

### 3. **Firebase Configuration**
- **Only using**: Firebase Auth + Firestore
- **Not using**: Firebase Storage (not free)
- Configured in `app.module.ts` with proper providers

### 4. **Authentication System**
- Simplified auth service (`auth.service.ts`)
- User model: `uid`, `email`, `displayName`, `role` ('admin' | 'user')
- Guards: `AuthGuard` and `RoleGuard` for route protection

### 5. **Routes**
```
/login -> Login page
/register -> Registration page
/admin-dashboard -> Admin dashboard (requires admin role)
/user-dashboard -> User dashboard (requires user role)
```

### 6. **Features**

#### Admin Dashboard
- View total users count
- See admin vs regular users statistics
- List recent users with their roles
- User management capabilities

#### User Dashboard  
- Simple welcome card with user info
- Quick stats (tasks completed, pending tasks)
- Recent activity section
- Logout functionality

### 7. **Firebase Firestore Structure**
```
users/
  {uid}/
    - uid: string
    - email: string
    - displayName: string
    - role: 'admin' | 'user'
    - createdAt: Date
    - updatedAt: Date
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Firebase Configuration**
   - Your Firebase config is already in `src/environments/environment.ts`
   - Firestore rules should allow authenticated users to read/write their own data
   - Admins can read all user data

3. **Firestore Security Rules** (Suggested)
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
         allow read, write: if request.auth != null && 
           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
       }
     }
   }
   ```

4. **Run the App**
   ```bash
   npm start
   # or
   ionic serve
   ```

5. **Create First Admin User**
   - Register through the app and select "Admin" role
   - Or manually set role in Firestore console

## File Structure
```
src/app/
├── auth/
│   ├── login/          # Login page
│   ├── register/       # Registration page
│   └── auth.service.ts # Authentication service
├── admin/
│   └── dashboard/      # Admin dashboard
├── user/
│   └── dashboard/      # User dashboard
├── guards/
│   ├── auth-guard.ts   # Authentication guard
│   └── role-guard.ts   # Role-based guard
└── app-routing.module.ts
```

## Notes
- All unnecessary modules and features have been removed
- The app now focuses only on user management with admin/user roles
- No storage features to keep it free tier compatible
- Simple, clean dashboards for both roles
