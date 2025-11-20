// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { IonicModule } from '@ionic/angular';
// import { FormsModule } from '@angular/forms';
// import { AlertController, LoadingController, ToastController } from '@ionic/angular';
// import { Router } from '@angular/router';
// import { AnnouncementService } from '../../services/announcement.service';
// import { Announcement, AnnouncementWithStatus, AnnouncementStatus } from '../../models/announcement.model';
// import { Auth } from '@angular/fire/auth';
// @Component({
//   standalone: true,
//   imports: [CommonModule, IonicModule,FormsModule],
//   selector: 'app-manage-announcement',
//   templateUrl: './manage-announcement.page.html',
//   styleUrls: ['./manage-announcement.page.scss'],
// })
// export class ManageAnnouncementPage implements OnInit {
// announcements: AnnouncementWithStatus[] = [];
//   filteredAnnouncements: AnnouncementWithStatus[] = [];
  
//   // Top cards data
//   upcomingAnnouncements: AnnouncementWithStatus[] = [];
//   latestAnnouncements: AnnouncementWithStatus[] = [];
//   ongoingAnnouncements: AnnouncementWithStatus[] = [];
  
//   // Filters
//   selectedCategory: string = 'all';
//   selectedPriority: string = 'all';
//   selectedStatus: string = 'all';
//   searchTerm: string = '';
  
//   loading: boolean = false;

//   constructor(
//     private announcementService: AnnouncementService,
//     private router: Router,
//     private alertController: AlertController,
//     private loadingController: LoadingController,
//     private toastController: ToastController,
//     private auth: Auth
//   ) {}

//   ngOnInit() {
//     this.loadAnnouncements();
//   }

//   ionViewWillEnter() {
//     this.loadAnnouncements();
//   }

//   async loadAnnouncements() {
//     this.loading = true;
//     const loading = await this.loadingController.create({
//       message: 'Loading announcements...'
//     });
//     await loading.present();

//     this.announcementService.getAllAnnouncements().subscribe({
//       next: (data) => {
//         this.announcements = data;
//         this.applyFilters();
//         this.prepareTopCards();
//         loading.dismiss();
//         this.loading = false;
//       },
//       error: (error) => {
//         console.error('Error loading announcements:', error);
//         this.presentToast('Error loading announcements', 'danger');
//         loading.dismiss();
//         this.loading = false;
//       }
//     });
//   }

//   prepareTopCards() {
//     // Upcoming announcements (active, upcoming status)
//     this.upcomingAnnouncements = this.announcements
//       .filter(a => a.status === 'upcoming' && a.isActive)
//       .sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime())
//       .slice(0, 1);
    
//     // Latest announcements (2 most recent)
//     this.latestAnnouncements = this.announcements
//       .filter(a => a.isActive)
//       .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
//       .slice(0, 2);
    
//     // Ongoing announcements
//     this.ongoingAnnouncements = this.announcements
//       .filter(a => a.status === 'ongoing' && a.isActive)
//       .slice(0, 1);
//   }

//   applyFilters() {
//     let filtered = [...this.announcements];

//     // Category filter
//     if (this.selectedCategory !== 'all') {
//       filtered = filtered.filter(a => a.category === this.selectedCategory);
//     }

//     // Priority filter
//     if (this.selectedPriority !== 'all') {
//       filtered = filtered.filter(a => a.priority === this.selectedPriority);
//     }

//     // Status filter
//     if (this.selectedStatus !== 'all') {
//       filtered = filtered.filter(a => a.status === this.selectedStatus);
//     }

//     // Search filter
//     if (this.searchTerm.trim()) {
//       const term = this.searchTerm.toLowerCase();
//       filtered = filtered.filter(a =>
//         a.title.toLowerCase().includes(term) ||
//         a.content.toLowerCase().includes(term)
//       );
//     }

//     this.filteredAnnouncements = filtered;
//   }

//   onCategoryChange(event: any) {
//     this.selectedCategory = event.detail.value;
//     this.applyFilters();
//   }

//   onPriorityChange(event: any) {
//     this.selectedPriority = event.detail.value;
//     this.applyFilters();
//   }

//   onStatusChange(event: any) {
//     this.selectedStatus = event.detail.value;
//     this.applyFilters();
//   }

//   onSearchChange(event: any) {
//     this.searchTerm = event.detail.value || '';
//     this.applyFilters();
//   }

//   addAnnouncement() {
//     this.router.navigate(['/admin/announcements/add']);
//   }

//   viewAnnouncement(announcement: AnnouncementWithStatus) {
//     this.router.navigate(['/admin/announcements/view', announcement.id]);
//   }

//   editAnnouncement(announcement: AnnouncementWithStatus, event?: Event) {
//     if (event) {
//       event.stopPropagation();
//     }
//     this.router.navigate(['/admin/announcements/edit', announcement.id]);
//   }

//   async toggleStatus(announcement: AnnouncementWithStatus, event: Event) {
//     event.stopPropagation();
    
//     const alert = await this.alertController.create({
//       header: 'Confirm Action',
//       message: `Are you sure you want to ${announcement.isActive ? 'deactivate' : 'activate'} this announcement?`,
//       buttons: [
//         {
//           text: 'Cancel',
//           role: 'cancel'
//         },
//         {
//           text: 'Confirm',
//           handler: async () => {
//             try {
//               await this.announcementService.toggleActiveStatus(
//                 announcement.id!,
//                 !announcement.isActive
//               );
//               this.presentToast('Status updated successfully', 'success');
//               this.loadAnnouncements();
//             } catch (error) {
//               this.presentToast('Error updating status', 'danger');
//             }
//           }
//         }
//       ]
//     });

//     await alert.present();
//   }

//   async deleteAnnouncement(announcement: AnnouncementWithStatus, event: Event) {
//     event.stopPropagation();
    
//     const alert = await this.alertController.create({
//       header: 'Confirm Delete',
//       message: `Are you sure you want to delete "${announcement.title}"? This action cannot be undone.`,
//       buttons: [
//         {
//           text: 'Cancel',
//           role: 'cancel'
//         },
//         {
//           text: 'Delete',
//           role: 'destructive',
//           handler: async () => {
//             const loading = await this.loadingController.create({
//               message: 'Deleting...'
//             });
//             await loading.present();

//             try {
//               await this.announcementService.deleteAnnouncement(
//                 announcement.id!,
//                 announcement.imageUrl
//               );
//               this.presentToast('Announcement deleted successfully', 'success');
//               this.loadAnnouncements();
//             } catch (error) {
//               this.presentToast('Error deleting announcement', 'danger');
//             } finally {
//               loading.dismiss();
//             }
//           }
//         }
//       ]
//     });

//     await alert.present();
//   }

//   getStatusColor(status: AnnouncementStatus): string {
//     switch (status) {
//       case 'upcoming':
//         return 'primary';
//       case 'ongoing':
//         return 'success';
//       case 'completed':
//         return 'medium';
//       default:
//         return 'medium';
//     }
//   }

//   getPriorityColor(priority: string): string {
//     switch (priority) {
//       case 'high':
//         return 'danger';
//       case 'medium':
//         return 'warning';
//       case 'low':
//         return 'success';
//       default:
//         return 'medium';
//     }
//   }

//   getCategoryIcon(category: string): string {
//     switch (category) {
//       case 'general':
//         return 'information-circle';
//       case 'emergency':
//         return 'alert-circle';
//       case 'event':
//         return 'calendar';
//       case 'meeting':
//         return 'people';
//       case 'public_service':
//         return 'business';
//       default:
//         return 'document';
//     }
//   }

//   async presentToast(message: string, color: string) {
//     const toast = await this.toastController.create({
//       message,
//       duration: 2000,
//       color,
//       position: 'top'
//     });
//     toast.present();
//   }

//   refreshAnnouncements(event: any) {
//     this.loadAnnouncements();
//     setTimeout(() => {
//       event.target.complete();
//     }, 1000);
//   }
// }

// src/app/admin/manage-announcements/manage-announcements.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms'; 
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AnnouncementService } from '../../services/announcement.service';
import { Announcement, AnnouncementWithStatus, AnnouncementStatus } from '../../models/announcement.model';
import { Auth } from '@angular/fire/auth';

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  selector: 'app-manage-announcement',
  templateUrl: './manage-announcement.page.html',
  styleUrls: ['./manage-announcement.page.scss'],
})
export class ManageAnnouncementPage implements OnInit {
  announcements: AnnouncementWithStatus[] = [];
  filteredAnnouncements: AnnouncementWithStatus[] = [];
  
  // Top cards data
  upcomingAnnouncements: AnnouncementWithStatus[] = [];
  latestAnnouncements: AnnouncementWithStatus[] = [];
  ongoingAnnouncements: AnnouncementWithStatus[] = [];
  
  // Filters
  selectedCategory: string = 'all';
  selectedPriority: string = 'all';
  selectedStatus: string = 'all';
  searchTerm: string = '';
  
  loading: boolean = false;

  // constructor(
  //   private announcementService: AnnouncementService,
  //   private router: Router,
  //   private alertController: AlertController,
  //   private loadingController: LoadingController,
  //   private toastController: ToastController,
  //   private auth: Auth
  // ) {}
  // In manage-announcements.page.ts constructor or ngOnInit
constructor(
  private announcementService: AnnouncementService,
  private router: Router,
  private alertController: AlertController,
  private loadingController: LoadingController,
  private toastController: ToastController,
  private auth: Auth
) {
  // Check authentication state
  this.auth.onAuthStateChanged((user) => {
    if (!user) {
      console.log('User not authenticated, redirecting to login...');
      this.router.navigate(['/login']);
    }
  });
}

  ngOnInit() {
    this.loadAnnouncements();
  }

  ionViewWillEnter() {
    this.loadAnnouncements();
  }

  // async loadAnnouncements() {
  //   this.loading = true;
  //   const loading = await this.loadingController.create({
  //     message: 'Loading announcements...'
  //   });
  //   await loading.present();

  //   try {
  //     this.announcementService.getAllAnnouncements().subscribe({
  //       next: (data) => {
  //         this.announcements = data;
  //         this.applyFilters();
  //         this.prepareTopCards();
  //         this.loading = false;
  //       },
  //       error: (error) => {
  //         console.error('Error loading announcements:', error);
  //         this.presentToast('Error loading announcements', 'danger');
  //         this.loading = false;
  //       },
  //       complete: () => {
  //         loading.dismiss();
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Error loading announcements:', error);
  //     this.presentToast('Error loading announcements', 'danger');
  //     loading.dismiss();
  //     this.loading = false;
  //   }
  // }
  // Add this method to your ManageAnnouncementsPage class
async loadAnnouncements() {
  this.loading = true;
  const loading = await this.loadingController.create({
    message: 'Loading announcements...'
  });
  
  try {
    await loading.present();
    
    this.announcementService.getAllAnnouncements().subscribe({
      next: (data) => {
        console.log('Loaded announcements:', data.length);
        this.announcements = data;
        this.applyFilters();
        this.prepareTopCards();
        loading.dismiss();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading announcements:', error);
        this.presentToast('Error loading announcements. Please check your connection.', 'danger');
        loading.dismiss();
        this.loading = false;
        
        // Fallback: set empty arrays to avoid infinite loading
        this.announcements = [];
        this.filteredAnnouncements = [];
        this.upcomingAnnouncements = [];
        this.latestAnnouncements = [];
        this.ongoingAnnouncements = [];
      }
    });
  } catch (error) {
    console.error('Error in loadAnnouncements:', error);
    loading.dismiss();
    this.loading = false;
  }
}

  prepareTopCards() {
    // Upcoming announcements (active, upcoming status)
    this.upcomingAnnouncements = this.announcements
      .filter(a => a.status === 'upcoming' && a.isActive)
      .sort((a, b) => {
        const dateA = a.when ? new Date(a.when).getTime() : 0;
        const dateB = b.when ? new Date(b.when).getTime() : 0;
        return dateA - dateB;
      })
      .slice(0, 1);
    
    // Latest announcements (2 most recent)
    this.latestAnnouncements = this.announcements
      .filter(a => a.isActive)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 2);
    
    // Ongoing announcements
    this.ongoingAnnouncements = this.announcements
      .filter(a => a.status === 'ongoing' && a.isActive)
      .slice(0, 1);
  }

  applyFilters() {
    let filtered = [...this.announcements];

    // Category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === this.selectedCategory);
    }

    // Priority filter
    if (this.selectedPriority !== 'all') {
      filtered = filtered.filter(a => a.priority === this.selectedPriority);
    }

    // Status filter
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(a => a.status === this.selectedStatus);
    }

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(term) || 
        a.content.toLowerCase().includes(term)
      );
    }

    this.filteredAnnouncements = filtered;
  }

  onCategoryChange(event: any) {
    this.selectedCategory = event.detail.value;
    this.applyFilters();
  }

  onPriorityChange(event: any) {
    this.selectedPriority = event.detail.value;
    this.applyFilters();
  }

  onStatusChange(event: any) {
    this.selectedStatus = event.detail.value;
    this.applyFilters();
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || '';
    this.applyFilters();
  }

  addAnnouncement() {
    console.log('Navigating to add announcement');
    this.router.navigate(['/admin/announcements/add']);
  }

  viewAnnouncement(announcement: AnnouncementWithStatus) {
    this.router.navigate(['/admin/announcements/view', announcement.id]);
  }

  editAnnouncement(announcement: AnnouncementWithStatus, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/admin/announcements/edit', announcement.id]);
  }

  async toggleStatus(announcement: AnnouncementWithStatus, event: Event) {
    event.stopPropagation();
    
    const alert = await this.alertController.create({
      header: 'Confirm Action',
      message: `Are you sure you want to ${announcement.isActive ? 'deactivate' : 'activate'} this announcement?`,
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
                announcement.id!,
                !announcement.isActive
              );
              this.presentToast('Status updated successfully', 'success');
              this.loadAnnouncements();
            } catch (error) {
              this.presentToast('Error updating status', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteAnnouncement(announcement: AnnouncementWithStatus, event: Event) {
    event.stopPropagation();
    
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete "${announcement.title}"? This action cannot be undone.`,
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
                announcement.id!,
                announcement.imageUrl
              );
              this.presentToast('Announcement deleted successfully', 'success');
              this.loadAnnouncements();
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

  refreshAnnouncements(event: any) {
    this.loadAnnouncements();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  
}