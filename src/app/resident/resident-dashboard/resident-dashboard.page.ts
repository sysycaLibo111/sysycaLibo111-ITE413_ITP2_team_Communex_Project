// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { IonicModule } from '@ionic/angular';
// import { AuthService, User } from '../../auth/auth.service';
// import { Router } from '@angular/router';

// @Component({
//   standalone: true,
//   imports: [CommonModule, IonicModule],
//   selector: 'app-resident-dashboard',
//   templateUrl: './resident-dashboard.page.html',
//   styleUrls: ['./resident-dashboard.page.scss'],
// })
// export class ResidentDashboardPage implements OnInit {
// user: User | null = null;
//   constructor(
//     private authService: AuthService,
//     private router: Router
//   ) { }

//   ngOnInit() {
//     this.authService.currentUser$.subscribe(user => {
//       this.user = user;
//     });
//   }

//   async logout() {
//     try {
//       await this.authService.logout();
//     } catch (error: any) {
//       console.error('Logout error:', error.message);
//     }
//   }
// }
// resi
// resident-dashboard.page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { AnnouncementService } from '../../services/announcement.service';
import { AnnouncementWithStatus } from '../../models/announcement.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-resident-dashboard',
  templateUrl: './resident-dashboard.page.html',
  styleUrls: ['./resident-dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class ResidentDashboardPage implements OnInit, OnDestroy {
  announcements: AnnouncementWithStatus[] = [];
  filteredAnnouncements: AnnouncementWithStatus[] = [];
  isLoading = true;
  private announcementsSubscription!: Subscription;

  // Filter options - use string type instead of union type
  currentFilter = 'all';
  searchTerm = '';

  // Define valid filter values for type safety
  private readonly validFilters = ['all', 'announcements', 'events'];

  constructor(private announcementService: AnnouncementService) {}

  ngOnInit() {
    this.loadAnnouncements();
  }

  ngOnDestroy() {
    if (this.announcementsSubscription) {
      this.announcementsSubscription.unsubscribe();
    }
  }

  loadAnnouncements() {
    this.isLoading = true;
    this.announcementsSubscription = this.announcementService.getAllAnnouncements()
      .subscribe({
        next: (announcements) => {
          this.announcements = announcements
            .filter(announcement => announcement.isActive)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading announcements:', error);
          this.isLoading = false;
        }
      });
  }

  applyFilters() {
    let filtered = this.announcements;

    // Apply type filter
    if (this.currentFilter === 'announcements') {
      filtered = filtered.filter(item => item.category === 'general');
    } else if (this.currentFilter === 'events') {
      filtered = filtered.filter(item => item.category !== 'general');
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(term) ||
        item.content.toLowerCase().includes(term) ||
        (item.what && item.what.toLowerCase().includes(term)) ||
        (item.where && item.where.toLowerCase().includes(term))
      );
    }

    this.filteredAnnouncements = filtered;
  }

  // Updated method to handle SegmentValue type
  onFilterChange(filterValue: any) {
    // Convert to string and validate
    const filter = String(filterValue);
    
    if (this.validFilters.includes(filter)) {
      this.currentFilter = filter;
      this.applyFilters();
    } else {
      // Fallback to 'all' if invalid value
      this.currentFilter = 'all';
      this.applyFilters();
    }
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || '';
    this.applyFilters();
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }

  getCardSubtitle(announcement: AnnouncementWithStatus): string {
    if (announcement.category === 'general') {
      return 'Announcement';
    }
    return `Event • ${announcement.status}`;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'upcoming': return 'primary';
      case 'ongoing': return 'success';
      case 'completed': return 'medium';
      default: return 'medium';
    }
  }

  handleRefresh(event: any) {
    this.loadAnnouncements();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  openDetails(announcement: AnnouncementWithStatus) {
    // Navigate to details page or open modal
    console.log('Opening details for:', announcement.title);
    // You can implement navigation to details page here
  }

  // Optional: Like/Save functionality
  toggleLike(announcement: AnnouncementWithStatus, event: Event) {
    event.stopPropagation();
    // Implement like functionality
    console.log('Toggle like for:', announcement.title);
  }

  toggleSave(announcement: AnnouncementWithStatus, event: Event) {
    event.stopPropagation();
    // Implement save functionality
    console.log('Toggle save for:', announcement.title);
  }
}