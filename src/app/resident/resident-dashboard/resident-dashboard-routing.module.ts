import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ResidentDashboardPage } from './resident-dashboard.page';

const routes: Routes = [
  {
    path: '',
    component: ResidentDashboardPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ResidentDashboardPageRoutingModule {}
