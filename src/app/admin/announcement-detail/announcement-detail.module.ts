import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { AnnouncementDetailPageRoutingModule } from './announcement-detail-routing.module';

import { AnnouncementDetailPage } from './announcement-detail.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AnnouncementDetailPageRoutingModule,
    AnnouncementDetailPage
  ],
  declarations: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AnnouncementDetailPageModule {}
