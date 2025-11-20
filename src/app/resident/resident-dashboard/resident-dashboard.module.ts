// resident/resident-dashboard/resident-dashboard.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ResidentDashboardPageRoutingModule } from './resident-dashboard-routing.module';
import { ResidentDashboardPage } from './resident-dashboard.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ResidentDashboardPageRoutingModule,
    ResidentDashboardPage
  ],
  declarations: []
})
export class ResidentDashboardPageModule {}