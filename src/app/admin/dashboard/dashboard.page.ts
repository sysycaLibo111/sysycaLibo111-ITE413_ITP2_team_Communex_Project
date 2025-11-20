
import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AuthService, User } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable, tap } from 'rxjs';
import * as L from 'leaflet';
import 'leaflet.markercluster';

interface FirebaseUser {
  id: string;
  barangay: string;
  sitio: string;
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

// interface ResidentLocation {
//   id: string;
//   areaName: string;
//   lat: number;
//   lng: number;
//   residentCount: number;
//   residents: FirebaseUser[];
//   barangay: string;
//   sitio: string;
//   lastUpdated: Date;
// }
interface ResidentLocation {
  id: string;
  areaName: string;
  lat: number;
  lng: number;
  residentCount: number;
  residents: FirebaseUser[];
  barangay: string;  
  sitio: string;
  lastUpdated: Date;
}


@Component({
  standalone: true,
  imports: [CommonModule, IonicModule],
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer: any;

  user: User | null = null;
  users$: Observable<FirebaseUser[]>;
  totalUsers = 0;
  adminUsers = 0;
  residentUsers = 0;
  
  // Leaflet Map properties
  map: L.Map | null = null;
  mapView: 'streets' | 'satellite' | 'terrain' = 'streets';
  selectedLocation: ResidentLocation | null = null;
  residentLocations: ResidentLocation[] = [];
  markers: L.Marker[] = [];
  markerClusterGroup: L.MarkerClusterGroup | null = null;

  // Leaflet tile layers
  tileLayers: { [key: string]: string } = {
    streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private firestore: Firestore
  ) {
    this.users$ = collectionData(collection(this.firestore, 'users'), { 
      idField: 'id' 
    }) as Observable<FirebaseUser[]>;
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });

    this.users$.pipe(
      tap(users => {
        this.totalUsers = users.length;
        this.adminUsers = users.filter(u => u.role === 'admin').length;
        this.residentUsers = users.filter(u => u.role === 'resident').length;
        
        // Process real resident locations from Firebase data
        this.processRealResidentLocations(users);
        
        // Update map markers if map is already initialized
        if (this.map) {
          this.addResidentMarkers();
        }
      })
    ).subscribe();
  }

  ngAfterViewInit() {
    // Initialize map after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.initMap();
    }, 500);
  }

  ngOnDestroy() {
    // Clean up map when component is destroyed
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  initMap() {
    if (!this.mapContainer?.nativeElement) {
      console.error('Map container not found');
      return;
    }

    try {
      // Initialize Leaflet Map centered on Philippines (Manila)
      this.map = L.map(this.mapContainer.nativeElement, {
      center: [13.1690, 121.2788], // Poblacion III, Victoria, Oriental Mindoro coordinates
      zoom: 15,
      minZoom: 13,
      maxZoom: 18,
      maxBounds: L.latLngBounds(
        L.latLng(13.1400, 121.2500),   // Southwest boundary (wider area around Victoria)
        L.latLng(13.1900, 121.3000)    // Northeast boundary
      ),
      maxBoundsViscosity: 1.0
    });
      // Add tile layer based on current view
      const tileLayer = L.tileLayer(this.tileLayers[this.mapView], {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
        tileSize: 256
      });
      tileLayer.addTo(this.map);

      // Initialize marker cluster group
      this.markerClusterGroup = L.markerClusterGroup({
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount();
          let className = 'marker-cluster-small';
          
          if (count > 25) {
            className = 'marker-cluster-large';
          } else if (count > 15) {
            className = 'marker-cluster-medium';
          }
          
          return L.divIcon({
            html: `<div><span>${count}</span></div>`,
            className: `marker-cluster ${className}`,
            iconSize: L.point(40, 40)
          });
        },
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 50
      });

      this.map.addLayer(this.markerClusterGroup);

      // Force map to invalidate size after a short delay
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);

      // Add resident markers to the map
      if (this.residentLocations.length > 0) {
        this.addResidentMarkers();
      }

    } catch (error) {
      console.error('Error initializing Leaflet Map:', error);
    }
  }

  processRealResidentLocations(users: FirebaseUser[]) {
    // Filter users with valid location data in Philippines
    const usersWithLocation = users.filter(user => 
      user.location && 
      user.location.latitude && 
      user.location.longitude &&
      this.isInPhilippines(user.location.latitude, user.location.longitude)
    );

    // Group users by sitio and calculate average coordinates
    const sitioGroups = this.groupBySitioWithAverageLocation(usersWithLocation);
    
    // Convert to resident locations format
    // .residentthisLocations = Object.entries(sitioGroups).map(([sitio, data]) => {
    //   return {
    //     id: sitio,
    //     areaName:sitio,
    //     sitio: sitio,
    //     lat: data.avgLat,
    //     lng: data.avgLng,
    //     residentCount: data.residents.length,
    //     residents: data.residents,
    //     lastUpdated: new Date()
    //   };
    // });
    this.residentLocations = Object.entries(sitioGroups).map(([sitio, data]) => {
  return {
    id: sitio,
    areaName: sitio,
    sitio: sitio,
    barangay: data.residents[0]?.barangay || 'Unknown Barangay', // ✅ REQUIRED FIELD FIXED
    lat: data.avgLat,
    lng: data.avgLng,
    residentCount: data.residents.length,
    residents: data.residents,
    lastUpdated: new Date()
  };
});


    console.log('Processed resident locations:', this.residentLocations);
  }

  groupBySitioWithAverageLocation(users: FirebaseUser[]): { [key: string]: { residents: FirebaseUser[], avgLat: number, avgLng: number } } {
    const groups = users.reduce((acc, user) => {
      const sitio = user.sitio || 'Unknown Sitio';
      if (!acc[sitio]) {
        acc[sitio] = {
          residents: [],
          totalLat: 0,
          totalLng: 0
        };
      }
      acc[sitio].residents.push(user);
      acc[sitio].totalLat += user.location.latitude;
      acc[sitio].totalLng += user.location.longitude;
      return acc;
    }, {} as { [key: string]: { residents: FirebaseUser[], totalLat: number, totalLng: number } });

    // Calculate averages
    const result: { [key: string]: { residents: FirebaseUser[], avgLat: number, avgLng: number } } = {};
    
    Object.keys(groups).forEach(sitio => {
      const group = groups[sitio];
      result[sitio] = {
        residents: group.residents,
        avgLat: group.totalLat / group.residents.length,
        avgLng: group.totalLng / group.residents.length
      };
    });

    return result;
  }

  isInPhilippines(lat: number, lng: number): boolean {
    return lat >= 4.5 && lat <= 21.1 && lng >= 116.9 && lng <= 126.6;
  }

  addResidentMarkers() {
    if (!this.map || !this.markerClusterGroup) return;

    // Clear existing markers
    this.clearMarkers();

    // Create bounds to fit all markers
    const bounds = L.latLngBounds([]);

    this.residentLocations.forEach(location => {
      // Create custom icon
      const icon = this.createCustomIcon(location.residentCount);

      // Create marker
      const marker = L.marker([location.lat, location.lng], {
        icon: icon,
        title: `${location.sitio}: ${location.residentCount} residents`
      });

      // Bind popup
      const popupContent = `
        <div class="custom-popup">
          <h3>${location.sitio}</h3>
          <p><strong>${location.residentCount}</strong> residents</p>
          <button class="view-details-btn" data-location-id="${location.id}">View Details</button>
        </div>
      `;
      
      marker.bindPopup(popupContent);

      // Add click event to popup button
      marker.on('popupopen', () => {
        const btn = document.querySelector(`[data-location-id="${location.id}"]`);
        if (btn) {
          btn.addEventListener('click', () => {
            this.selectLocation(location.id);
          });
        }
      });

      // Add to marker cluster group
      this.markerClusterGroup!.addLayer(marker);
      this.markers.push(marker);

      // Extend bounds
      bounds.extend([location.lat, location.lng]);
    });

    // Fit map to show all markers
    if (this.markers.length > 0 && this.map) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  createCustomIcon(residentCount: number): L.DivIcon {
    const color = this.getMarkerColor(residentCount);
    const size = Math.max(30, Math.min(50, 30 + residentCount * 0.5));
    
    return L.divIcon({
      html: `
        <div class="custom-marker" style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${Math.max(12, size * 0.35)}px;
          box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        ">
          ${residentCount}
        </div>
      `,
      className: 'custom-marker-container',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }

  getMarkerColor(residentCount: number): string {
    if (residentCount > 25) return '#f44336'; // Red
    if (residentCount > 15) return '#ff9800'; // Orange
    return '#4caf50'; // Green
  }

  clearMarkers() {
    if (this.markerClusterGroup) {
      this.markerClusterGroup.clearLayers();
    }
    this.markers = [];
  }

  selectLocation(locationId: string) {
    this.selectedLocation = this.residentLocations.find(loc => loc.id === locationId) || null;
  }

  onMapViewChange(event: any) {
    this.mapView = event.detail.value;
    if (this.map) {
      // Remove existing tile layers
      this.map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          this.map!.removeLayer(layer);
        }
      });
      
      // Add new tile layer
      L.tileLayer(this.tileLayers[this.mapView], {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(this.map);
    }
  }

  viewResidentsInArea(location: ResidentLocation) {
    this.router.navigate(['/user-management'], { 
      queryParams: { sitio: location.sitio } 
    });
    this.selectedLocation = null;
  }

  viewUserDetails(user: FirebaseUser) {
    this.router.navigate(['/user-details', user.id]);
  }

  calculateAverageAge(residents: FirebaseUser[]): number {
    return 35; // Placeholder
  }

  async logout() {
    try {
      await this.authService.logout();
    } catch (error: any) {
      console.error('Logout error:', error.message);
    }
  }

  navigateToEvent() {
    this.router.navigate(['/event']);
  }
  
  navigateToAnnouncement() {
    this.router.navigate(['/manage-announcement']);
  }
  
  navigateToSettings() {
    this.router.navigate(['/settings']);
  }
  
  navigateToUsers() {
    this.router.navigateByUrl('/user-management');
  }
}