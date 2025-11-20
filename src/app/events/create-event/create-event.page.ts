// import { Component, OnInit } from '@angular/core';

// @Component({
//   selector: 'app-create-event',
//   templateUrl: './create-event.page.html',
//   styleUrls: ['./create-event.page.scss'],
// })
// export class CreateEventPage implements OnInit {

//   constructor() { }

//   ngOnInit() {
//   }

// }
// events/create-event/create-event.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { EventService } from '../../services/event.service';
import { AuthService } from '../../auth/auth.service';;

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.page.html',
  styleUrls: ['./create-event.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class CreateEventPage {
  eventForm: FormGroup;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private router: Router,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    this.eventForm = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      // 5W1H Fields
      what: ['', [Validators.required]],
      when: ['', [Validators.required]],
      where: ['', [Validators.required]],
      who: ['', [Validators.required]],
      why: ['', [Validators.required]],
      how: ['', [Validators.required]],
      // Additional fields
      maxAttendees: [null],
      isRegistrationRequired: [false]
    });
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showToast('Please select a valid image file', 'danger');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('Image size should be less than 5MB', 'danger');
        return;
      }

      this.selectedImage = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedImage = null;
    this.imagePreview = null;
  }

  async onSubmit() {
    if (this.eventForm.invalid || this.isSubmitting) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({
      message: 'Creating event...',
    });
    await loading.present();

    try {
      const formValue = this.eventForm.value;
      const currentUser = this.authService.getCurrentUser();

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const eventData = {
        title: formValue.title,
        description: formValue.description,
        what: formValue.what,
        when: new Date(formValue.when),
        where: formValue.where,
        who: formValue.who,
        why: formValue.why,
        how: formValue.how,
        maxAttendees: formValue.maxAttendees,
        isRegistrationRequired: formValue.isRegistrationRequired,
        createdBy: currentUser.uid // Add this required field
      };

      const imageToUpload = this.selectedImage || undefined;
      const eventId = await this.eventService.createEvent(eventData, imageToUpload);

      await loading.dismiss();
      this.isSubmitting = false;

      await this.showToast('Event created successfully!', 'success');
      this.router.navigate(['/event-detail', eventId]);
    } catch (error: any) {
      await loading.dismiss();
      this.isSubmitting = false;
      console.error('Error creating event:', error);
      await this.showToast(error.message || 'Failed to create event', 'danger');
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.eventForm.controls).forEach(key => {
      const control = this.eventForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}