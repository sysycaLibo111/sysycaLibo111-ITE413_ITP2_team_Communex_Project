// import { Component, OnInit } from '@angular/core';

// @Component({
//   selector: 'app-event-list',
//   templateUrl: './event-list.page.html',
//   styleUrls: ['./event-list.page.scss'],
// })
// export class EventListPage implements OnInit {

//   constructor() { }

//   ngOnInit() {
//   }

// }
// events/event-list/event-list.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { AuthService } from '../../auth/auth.service';
import { Event } from '../../models/event.model';

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.page.html',
  styleUrls: ['./event-list.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class EventListPage implements OnInit {
  events: Event[] = [];
  filteredEvents: Event[] = [];
  isLoading = true;
  selectedFilter: 'all' | 'upcoming' | 'completed' = 'upcoming';
  isAdmin = false;

  constructor(
    private eventService: EventService,
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.isAdmin = this.authService.hasRole('admin');
    await this.loadEvents();
  }

  async loadEvents() {
    this.isLoading = true;
    try {
      this.events = await this.eventService.getEvents();
      this.applyFilter();
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      this.isLoading = false;
    }
  }

  applyFilter() {
    switch (this.selectedFilter) {
      case 'upcoming':
        this.filteredEvents = this.events.filter(event => 
          event.status === 'upcoming' || event.status === 'ongoing'
        );
        break;
      case 'completed':
        this.filteredEvents = this.events.filter(event => event.status === 'completed');
        break;
      default:
        this.filteredEvents = this.events;
    }
  }

  onFilterChange(event: any) {
    this.selectedFilter = event.detail.value;
    this.applyFilter();
  }

  viewEvent(event: Event) {
    this.router.navigate(['/event-detail', event.id]);
  }

  createEvent() {
    this.router.navigate(['/create-event']);
  }

  doRefresh(event: any) {
    this.loadEvents().then(() => {
      event.target.complete();
    });
  }
}