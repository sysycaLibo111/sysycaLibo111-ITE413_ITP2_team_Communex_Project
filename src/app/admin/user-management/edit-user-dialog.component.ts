// edit - user - dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface FirebaseUser {
  id: string;
  barangay: string;
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

export interface EditUserDialogData {
  user: FirebaseUser;
}

@Component({
  selector: 'app-edit-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="edit-dialog">
      <h2 mat-dialog-title>Edit User</h2>
      
      <mat-dialog-content>
        <form [formGroup]="editForm" class="edit-form">
          <!-- Display Name -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Display Name</mat-label>
            <input matInput formControlName="displayName" placeholder="Enter display name">
            <mat-icon matSuffix>person</mat-icon>
            <mat-error *ngIf="editForm.get('displayName')?.hasError('required')">
              Display name is required
            </mat-error>
          </mat-form-field>

          <!-- Email -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" placeholder="Enter email">
            <mat-icon matSuffix>email</mat-icon>
            <mat-error *ngIf="editForm.get('email')?.hasError('required')">
              Email is required
            </mat-error>
            <mat-error *ngIf="editForm.get('email')?.hasError('email')">
              Please enter a valid email
            </mat-error>
          </mat-form-field>

          <!-- Phone Number -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Phone Number</mat-label>
            <input matInput formControlName="phoneNumber" placeholder="Enter phone number">
            <mat-icon matSuffix>phone</mat-icon>
            <mat-error *ngIf="editForm.get('phoneNumber')?.hasError('required')">
              Phone number is required
            </mat-error>
          </mat-form-field>

          <!-- Barangay -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Barangay</mat-label>
            <input matInput formControlName="barangay" placeholder="Enter barangay">
            <mat-icon matSuffix>location_on</mat-icon>
            <mat-error *ngIf="editForm.get('barangay')?.hasError('required')">
              Barangay is required
            </mat-error>
          </mat-form-field>

          <!-- Role (Only non-admin roles) -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Role</mat-label>
            <mat-select formControlName="role">
              <mat-option value="resident">Resident</mat-option>
              <mat-option value="staff">Staff</mat-option>
              <mat-option value="volunteer">Volunteer</mat-option>
              <mat-option value="official">Barangay Official</mat-option>
            </mat-select>
            <mat-icon matSuffix>badge</mat-icon>
            <mat-error *ngIf="editForm.get('role')?.hasError('required')">
              Role is required
            </mat-error>
          </mat-form-field>

          <!-- Status -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="pending">Pending</mat-option>
              <mat-option value="approved">Approved</mat-option>
              <mat-option value="rejected">Rejected</mat-option>
            </mat-select>
            <mat-icon matSuffix>status</mat-icon>
            <mat-error *ngIf="editForm.get('status')?.hasError('required')">
              Status is required
            </mat-error>
          </mat-form-field>

          <!-- Location Coordinates -->
          <div class="location-fields">
            <h4>Location Coordinates</h4>
            <div class="row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Latitude</mat-label>
                <input matInput formControlName="latitude" type="number" step="0.000001">
                <mat-icon matSuffix>map</mat-icon>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Longitude</mat-label>
                <input matInput formControlName="longitude" type="number" step="0.000001">
                <mat-icon matSuffix>map</mat-icon>
              </mat-form-field>
            </div>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button 
                color="primary" 
                (click)="onSave()" 
                [disabled]="!editForm.valid || !editForm.dirty">
          Save Changes
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .edit-dialog {
      min-width: 400px;
      max-width: 600px;
    }
    
    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .location-fields {
      margin-top: 16px;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }
    
    .location-fields h4 {
      margin: 0 0 16px 0;
      color: #666;
    }
    
    .row {
      display: flex;
      gap: 16px;
    }
    
    .half-width {
      flex: 1;
    }
    
    @media (max-width: 600px) {
      .edit-dialog {
        min-width: 300px;
      }
      
      .row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class EditUserDialogComponent implements OnInit {
  editForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditUserDialogData
  ) {
    this.editForm = this.createForm();
  }

  ngOnInit() {
    this.populateForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      barangay: ['', [Validators.required]],
      role: ['', [Validators.required]],
      status: ['', [Validators.required]],
      latitude: [0],
      longitude: [0]
    });
  }

  private populateForm(): void {
    const user = this.data.user;
    this.editForm.patchValue({
      displayName: user.displayName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      barangay: user.barangay,
      role: user.role,
      status: user.status,
      latitude: user.location?.latitude || 0,
      longitude: user.location?.longitude || 0
    });
  }

  onSave(): void {
    if (this.editForm.valid) {
      const formValue = this.editForm.value;
      
      // Prepare the update data
      const updateData = {
        displayName: formValue.displayName,
        email: formValue.email,
        phoneNumber: formValue.phoneNumber,
        barangay: formValue.barangay,
        role: formValue.role,
        status: formValue.status,
        location: {
          latitude: formValue.latitude,
          longitude: formValue.longitude
        }
      };

      this.dialogRef.close(updateData);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}