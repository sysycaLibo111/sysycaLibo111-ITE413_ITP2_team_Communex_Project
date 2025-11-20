import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { AuthService } from '../auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  registerForm!: FormGroup;
  showPassword = false;
  isSubmitting = false;
  
  // Image upload properties
  imagePreview: string | ArrayBuffer | null = null;
  selectedImageBase64: string | undefined = undefined;
  isImageProcessing = false;

  // Predefined coordinates for sitios
  private sitioCoordinates: { [key: string]: { latitude: number; longitude: number } } = {
    'Balaoan': { latitude: 13.163668, longitude: 121.284389 },
    'Carumaguit': { latitude: 13.163306, longitude: 121.282933 },
    'Centro': { latitude: 13.164000, longitude: 121.285000 },
    'Dimalibot': { latitude: 13.162500, longitude: 121.283500 },
    'Gawad Kalinga': { latitude: 13.163800, longitude: 121.284800 },
    'Tamaraw A': { latitude: 13.163200, longitude: 121.284200 },
    'Tamaraw B': { latitude: 13.163400, longitude: 121.284400 }
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      age: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      gender: ['', Validators.required],
      status: ['', Validators.required],
      sitio: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  // Image upload methods
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isImageProcessing = true;

      if (!file.type.match('image.*')) {
        await this.showToast('Please select an image file', 'warning');
        this.isImageProcessing = false;
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        await this.showToast('Image size should be less than 2MB', 'warning');
        this.isImageProcessing = false;
        return;
      }

      try {
        await this.compressAndConvertToBase64(file);
      } catch (error) {
        console.error('Error processing image:', error);
        await this.showToast('Error processing image', 'danger');
      } finally {
        this.isImageProcessing = false;
      }
    }
  }

  private compressAndConvertToBase64(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      reader.onload = (e) => {
        img.onload = () => {
          const MAX_SIZE = 800;
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_SIZE) {
            height = (height * MAX_SIZE) / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width = (width * MAX_SIZE) / height;
            height = MAX_SIZE;
          }

          canvas.width = width;
          canvas.height = height;

          ctx?.drawImage(img, 0, 0, width, height);
          
          this.selectedImageBase64 = canvas.toDataURL('image/jpeg', 0.7);
          this.imagePreview = this.selectedImageBase64;
          
          resolve();
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        if (typeof reader.result === 'string') {
          img.src = reader.result;
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  async onRegister() {
    if (this.isSubmitting) {
      return;
    }

    if (this.registerForm.invalid) {
      await this.showToast('Please fill in all fields correctly', 'danger');
      this.markFormGroupTouched();
      return;
    }

    if (this.registerForm.hasError('passwordMismatch')) {
      await this.showToast('Passwords do not match', 'danger');
      return;
    }

    const selectedSitio = this.registerForm.get('sitio')?.value;
    if (!selectedSitio) {
      await this.showToast('Please select a sitio', 'danger');
      return;
    }

    const coordinates = this.sitioCoordinates[selectedSitio];
    if (!coordinates) {
      await this.showToast('Location coordinates not available', 'warning');
      return;
    }

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({
      message: 'Creating account...',
    });
    await loading.present();

    try {
      const { email, password, fullName, age, gender, status, sitio } = this.registerForm.value;

      // Create additional data object that matches AuthService interface
      const additionalData = {
        phoneNumber: '',
        barangay: 'Poblacion III',
        sitio: sitio,
        location: coordinates,
        age: age,
        gender: gender,
        status: status,
        profileImageBase64: this.selectedImageBase64 // This is now undefined if no image
      };

      const result = await this.authService.register(
        email,
        password,
        fullName,
        'resident',
        additionalData
      );
      
      await loading.dismiss();
      this.isSubmitting = false;

      if (result.success) {
        await this.showAlert(
          'Account Created!',
          'Your account has been created successfully. You can now log in.'
        );
        
        this.router.navigate(['/login']);
      } else {
        await this.showToast(result.message || 'Registration failed', 'danger');
      }
    } catch (error: any) {
      await loading.dismiss();
      this.isSubmitting = false;
      console.error('Registration error:', error);
      await this.showToast(error.message || 'Registration failed', 'danger');
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 4000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}