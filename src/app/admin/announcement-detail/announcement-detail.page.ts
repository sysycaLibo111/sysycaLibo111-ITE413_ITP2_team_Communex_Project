
// src/app/admin/announcement-detail/announcement-detail.page.ts

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { AnnouncementService } from '../../services/announcement.service';
import { AnnouncementWithStatus, AnnouncementStatus } from '../../models/announcement.model';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
@Component({
  standalone: true,
  imports: [CommonModule, IonicModule,  FormsModule],
  selector: 'app-announcement-detail',
  templateUrl: './announcement-detail.page.html',
  styleUrls: ['./announcement-detail.page.scss'],
})
export class AnnouncementDetailPage implements OnInit {
  announcement: AnnouncementWithStatus | null = null;
  announcementId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private announcementService: AnnouncementService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.announcementId = this.route.snapshot.paramMap.get('id');
    if (this.announcementId) {
      this.loadAnnouncement(this.announcementId);
    }
  }

  async loadAnnouncement(id: string) {
    const loading = await this.loadingController.create({
      message: 'Loading announcement...'
    });
    await loading.present();

    try {
      this.announcement = await this.announcementService.getAnnouncementById(id);
      if (!this.announcement) {
        this.presentToast('Announcement not found', 'danger');
        this.router.navigate(['/admin/manage-announcements']);
      }
    } catch (error) {
      console.error('Error loading announcement:', error);
      this.presentToast('Error loading announcement', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  editAnnouncement() {
    if (this.announcementId) {
      this.router.navigate(['/admin/announcements/edit', this.announcementId]);
    }
  }

  async toggleStatus() {
    if (!this.announcement) return;
    
    const alert = await this.alertController.create({
      header: 'Confirm Action',
      message: `Are you sure you want to ${this.announcement.isActive ? 'deactivate' : 'activate'} this announcement?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Confirm',
          handler: async () => {
            try {
              await this.announcementService.toggleActiveStatus(
                this.announcement!.id!,
                !this.announcement!.isActive
              );
              this.presentToast('Status updated successfully', 'success');
              this.loadAnnouncement(this.announcementId!);
            } catch (error) {
              this.presentToast('Error updating status', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteAnnouncement() {
    if (!this.announcement) return;
    
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete "${this.announcement.title}"? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Deleting...'
            });
            await loading.present();

            try {
              await this.announcementService.deleteAnnouncement(
                this.announcement!.id!,
                this.announcement!.imageUrl
              );
              this.presentToast('Announcement deleted successfully', 'success');
              this.router.navigate(['/admin/manage-announcements']);
            } catch (error) {
              this.presentToast('Error deleting announcement', 'danger');
            } finally {
              loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  getStatusColor(status: AnnouncementStatus): string {
    switch (status) {
      case 'upcoming':
        return 'primary';
      case 'ongoing':
        return 'success';
      case 'completed':
        return 'medium';
      default:
        return 'medium';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'medium';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'general':
        return 'information-circle';
      case 'emergency':
        return 'alert-circle';
      case 'event':
        return 'calendar';
      case 'meeting':
        return 'people';
      case 'public_service':
        return 'business';
      default:
        return 'document';
    }
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

  goBack() {
    this.router.navigate(['/admin/manage-announcements']);
  }
}