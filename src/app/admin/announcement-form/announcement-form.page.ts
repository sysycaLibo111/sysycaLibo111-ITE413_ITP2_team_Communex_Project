import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms'; 
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AnnouncementService } from '../../services/announcement.service';
import { Announcement } from '../../models/announcement.model';
import { Auth } from '@angular/fire/auth';

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  selector: 'app-announcement-form',
  templateUrl: './announcement-form.page.html',
  styleUrls: ['./announcement-form.page.scss'],
})
export class AnnouncementFormPage implements OnInit {
  isEditMode: boolean = false;
  announcementId: string | null = null;
  
  formData: Partial<Announcement> = {
    title: '',
    content: '',
    category: 'general',
    what: '',
    when: '',
    where: '',
    who: '',
    why: '',
    how: '',
    priority: 'medium',
    isActive: true
  };
  
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  currentImageUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private announcementService: AnnouncementService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private auth: Auth
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.announcementId = id;
      this.loadAnnouncement(id);
    }
  }

  // async loadAnnouncement(id: string) {
  //   const loading = await this.loadingController.create({
  //     message: 'Loading announcement...'
  //   });
  //   await loading.present();

  //   try {
  //     const announcement = await this.announcementService.getAnnouncementById(id);
  //     if (announcement) {
  //       this.formData = {
  //         title: announcement.title,
  //         content: announcement.content,
  //         category: announcement.category,
  //         what: announcement.what || '',
  //         when: announcement.when || '',
  //         where: announcement.where || '',
  //         who: announcement.who || '',
  //         why: announcement.why || '',
  //         how: announcement.how || '',
  //         priority: announcement.priority,
  //         isActive: announcement.isActive
  //       };
  //       this.currentImageUrl = announcement.imageUrl || null;
  //     } else {
  //       this.presentToast('Announcement not found', 'danger');
  //       this.router.navigate(['/admin/manage-announcements']);
  //     }
  //   } catch (error) {
  //     console.error('Error loading announcement:', error);
  //     this.presentToast('Error loading announcement', 'danger');
  //     this.router.navigate(['/admin/manage-announcements']);
  //   } finally {
  //     loading.dismiss();
  //   }
  // }

  // onImageSelected(event: any) {
  //   const file = event.target.files[0];
  //   if (file) {
  //     // Check if file is an image
  //     if (!file.type.startsWith('image/')) {
  //       this.presentToast('Please select an image file', 'danger');
  //       return;
  //     }

  //     // Check file size (max 5MB)
  //     if (file.size > 5 * 1024 * 1024) {
  //       this.presentToast('Image size should be less than 5MB', 'danger');
  //       return;
  //     }

  //     this.selectedImage = file;
      
  //     // Create preview
  //     const reader = new FileReader();
  //     reader.onload = (e: any) => {
  //       this.imagePreview = e.target.result;
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // }
  // Update loadAnnouncement to handle Base64 images
async loadAnnouncement(id: string) {
  const loading = await this.loadingController.create({
    message: 'Loading announcement...'
  });
  await loading.present();

  try {
    const announcement = await this.announcementService.getAnnouncementById(id);
    if (announcement) {
      this.formData = {
        title: announcement.title,
        content: announcement.content,
        category: announcement.category,
        what: announcement.what || '',
        when: announcement.when || '',
        where: announcement.where || '',
        who: announcement.who || '',
        why: announcement.why || '',
        how: announcement.how || '',
        priority: announcement.priority,
        isActive: announcement.isActive,
        imageBase64: announcement.imageBase64 || undefined
      };
      
      // Set image preview if Base64 image exists
      if (announcement.imageBase64) {
        this.imagePreview = announcement.imageBase64;
      } else if (announcement.imageUrl) {
        // Fallback to legacy imageUrl
        this.currentImageUrl = announcement.imageUrl;
      }
    } else {
      this.presentToast('Announcement not found', 'danger');
      this.router.navigate(['/admin/manage-announcements']);
    }
  } catch (error) {
    console.error('Error loading announcement:', error);
    this.presentToast('Error loading announcement', 'danger');
    this.router.navigate(['/admin/manage-announcements']);
  } finally {
    loading.dismiss();
  }
}
  onImageSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      this.presentToast('Please select an image file', 'danger');
      return;
    }

    // Check file size (max 500KB for Base64 to avoid large documents)
    if (file.size > 500 * 1024) {
      this.presentToast('Image size should be less than 500KB for better performance', 'warning');
      // You can choose to continue or return here
    }

    this.selectedImage = file;
    
    // Create preview and convert to Base64
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview = e.target.result;
      
      // Convert to Base64 and store in formData
      const base64String = e.target.result as string;
      this.formData.imageBase64 = base64String;
      
      // Clear the legacy imageUrl to avoid conflicts
      this.formData.imageUrl = undefined;
      this.currentImageUrl = null;
    };
    reader.readAsDataURL(file);
  }
}


  // removeImage() {
  //   this.selectedImage = null;
  //   this.imagePreview = null;
  //   this.currentImageUrl = null;
  // }
  removeImage() {
  this.selectedImage = null;
  this.imagePreview = null;
  this.currentImageUrl = null;
  this.formData.imageBase64 = undefined;
  this.formData.imageUrl = undefined;
}

  validateForm(): boolean {
    if (!this.formData.title?.trim()) {
      this.presentToast('Title is required', 'danger');
      return false;
    }

    if (!this.formData.content?.trim()) {
      this.presentToast('Content is required', 'danger');
      return false;
    }

    // Validate 5W1H for non-general categories
    if (this.formData.category !== 'general') {
      const requiredFields = [
        { field: 'what', name: 'What' },
        { field: 'when', name: 'When' },
        { field: 'where', name: 'Where' },
        { field: 'who', name: 'Who' },
        { field: 'why', name: 'Why' },
        { field: 'how', name: 'How' }
      ];

      for (const required of requiredFields) {
        if (!this.formData[required.field as keyof typeof this.formData]?.toString().trim()) {
          this.presentToast(`${required.name} field is required for this category`, 'danger');
          return false;
        }
      }
    }

    return true;
  }

  // async saveAnnouncement() {
  //   if (!this.validateForm()) {
  //     return;
  //   }

  //   const loading = await this.loadingController.create({
  //     message: this.isEditMode ? 'Updating announcement...' : 'Creating announcement...'
  //   });
  //   await loading.present();

  //   try {
  //     const currentUser = this.auth.currentUser;
  //     if (!currentUser) {
  //       throw new Error('No authenticated user');
  //     }

  //     let imageUrl = this.currentImageUrl;

  //     // Upload new image if selected
  //     if (this.selectedImage) {
  //       const tempId = this.announcementId || `temp_${Date.now()}`;
  //       imageUrl = await this.announcementService.uploadImage(this.selectedImage, tempId);
  //     }

  //     const announcementData = {
  //       ...this.formData,
  //       imageUrl: imageUrl || undefined
  //     };

  //     if (this.isEditMode && this.announcementId) {
  //       // Update existing
  //       await this.announcementService.updateAnnouncement(
  //         this.announcementId,
  //         announcementData
  //       );
  //       this.presentToast('Announcement updated successfully', 'success');
  //     } else {
  //       // Create new
  //       const newData = {
  //         ...announcementData,
  //         createdBy: currentUser.uid
  //       } as Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>;
        
  //       await this.announcementService.createAnnouncement(newData);
  //       this.presentToast('Announcement created successfully', 'success');
  //     }

  //     this.router.navigate(['/admin/manage-announcements']);
  //   } catch (error) {
  //     console.error('Error saving announcement:', error);
  //     this.presentToast('Error saving announcement', 'danger');
  //   } finally {
  //     loading.dismiss();
  //   }
  // }
  // Update saveAnnouncement to remove Storage upload
async saveAnnouncement() {
  if (!this.validateForm()) {
    return;
  }

  const loading = await this.loadingController.create({
    message: this.isEditMode ? 'Updating announcement...' : 'Creating announcement...'
  });
  await loading.present();

  try {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    // Prepare announcement data - no Storage upload needed
    const announcementData = {
      ...this.formData,
      createdBy: currentUser.uid
    };

    // Remove imageUrl if we're using Base64 to avoid conflicts
    if (this.formData.imageBase64) {
      announcementData.imageUrl = undefined;
    }

    if (this.isEditMode && this.announcementId) {
      // Update existing
      await this.announcementService.updateAnnouncement(
        this.announcementId,
        announcementData
      );
      this.presentToast('Announcement updated successfully', 'success');
    } else {
      // Create new
      await this.announcementService.createAnnouncement(
        announcementData as Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>
      );
      this.presentToast('Announcement created successfully', 'success');
    }

    this.router.navigate(['/admin/manage-announcements']);
  } catch (error) {
    console.error('Error saving announcement:', error);
    this.presentToast('Error saving announcement', 'danger');
  } finally {
    loading.dismiss();
  }
}


  cancel() {
    this.router.navigate(['/admin/manage-announcements']);
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    toast.present();
  }

  // Helper to check if 5W1H fields should be shown
  should5W1HFieldsShow(): boolean {
    return this.formData.category !== 'general';
  }
}