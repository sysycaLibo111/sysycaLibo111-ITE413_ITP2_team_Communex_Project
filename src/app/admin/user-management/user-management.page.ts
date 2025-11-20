// import { Component, OnInit, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { IonicModule } from '@ionic/angular';
// import { Router } from '@angular/router';

// // Angular Material imports
// import { MatTableModule } from '@angular/material/table';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatChipsModule } from '@angular/material/chips';
// import { MatCardModule } from '@angular/material/card';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// import { UserManagementService, FirebaseUser } from '../../services/user-management.service';

// @Component({
//   selector: 'app-user-management',
//   templateUrl: './user-management.page.html',
//   styleUrls: ['./user-management.page.scss'],
//   standalone: true,
//   imports: [
//     CommonModule,
//     IonicModule,
//     MatTableModule,
//     MatButtonModule,
//     MatIconModule,
//     MatChipsModule,
//     MatCardModule,
//     MatProgressSpinnerModule
//   ]
// })
// export class UserManagementPage implements OnInit {
//   private userService = inject(UserManagementService);
//   private router = inject(Router);

//   displayedColumns: string[] = [
//     'displayName',
//     'email',
//     'barangay',
//     'role',
//     'status',
//     'actions'
//   ];

//   // Use the service's reactive state
//   users = this.userService.users;
//   loading = this.userService.loading;

//   ngOnInit() {
//     this.userService.loadUsers().subscribe();
//   }

//   onApprove(user: FirebaseUser) {
//     this.userService.updateUserStatus(user.id, 'approved').then(() => {
//       console.log('User approved:', user.displayName);
//     }).catch(error => {
//       console.error('Error approving user:', error);
//     });
//   }

//   onReject(user: FirebaseUser) {
//     this.userService.updateUserStatus(user.id, 'rejected').then(() => {
//       console.log('User rejected:', user.displayName);
//     }).catch(error => {
//       console.error('Error rejecting user:', error);
//     });
//   }

//   onDelete(user: FirebaseUser) {
//     if (confirm(`Are you sure you want to delete user ${user.displayName}?`)) {
//       this.userService.deleteUser(user.id).then(() => {
//         console.log('User deleted:', user.displayName);
//       }).catch(error => {
//         console.error('Error deleting user:', error);
//       });
//     }
//   }

//   onView(user: FirebaseUser) {
//     this.userService.setSelectedUser(user);
//     // You can navigate to a detail page or open a modal here
//     console.log('View user:', user);
//   }

//   navigateToDashboard() {
//     this.router.navigate(['/dashboard']);
//   }
// }

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

// Angular Material imports
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { UserManagementService, FirebaseUser } from '../../services/user-management.service';
import { EditUserDialogComponent } from './edit-user-dialog.component';
@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.page.html',
  styleUrls: ['./user-management.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ]
})
export class UserManagementPage implements OnInit {
  private userService = inject(UserManagementService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  displayedColumns: string[] = [
    'displayName', 
    'email', 
    'barangay', 
    'sitio', 
    'role', 
    'status', 
    'actions'
  ];

  // Use the service's reactive state
  users = this.userService.users;
  loading = this.userService.loading;

  ngOnInit() {
    this.userService.loadUsers().subscribe();
  }

  onApprove(user: FirebaseUser) {
    this.userService.updateUserStatus(user.id, 'approved').subscribe({
      next: () => {
        console.log('User approved:', user.displayName);
      },
      error: (error) => {
        console.error('Error approving user:', error);
      }
    });
  }

  onReject(user: FirebaseUser) {
    this.userService.updateUserStatus(user.id, 'rejected').subscribe({
      next: () => {
        console.log('User rejected:', user.displayName);
      },
      error: (error) => {
        console.error('Error rejecting user:', error);
      }
    });
  }

  onDelete(user: FirebaseUser) {
    if (confirm(`Are you sure you want to delete user ${user.displayName}?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          console.log('User deleted:', user.displayName);
        },
        error: (error) => {
          console.error('Error deleting user:', error);
        }
      });
    }
  }

  onView(user: FirebaseUser) {
    this.userService.setSelectedUser(user);
    console.log('View user:', user);
  }

  // NEW: Edit user method - only for non-admin users
  onEdit(user: FirebaseUser) {
    // Check if user is not admin
    if (user.role === 'admin') {
      alert('Admin users cannot be edited through this interface.');
      return;
    }

    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      width: '600px',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.updateUser(user.id, result).subscribe({
          next: () => {
            console.log('User updated successfully:', user.displayName);
          },
          error: (error) => {
            console.error('Error updating user:', error);
          }
        });
      }
    });
  }

  // Helper method to check if user can be edited (non-admin only)
  canEditUser(user: FirebaseUser): boolean {
    return user.role !== 'admin';
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}