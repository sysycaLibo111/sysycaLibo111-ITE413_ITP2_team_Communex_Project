import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./auth/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./auth/register/register.module').then(m => m.RegisterPageModule)
  },
  {
    path: 'admin-dashboard',
    loadChildren: () => import('./admin/dashboard/dashboard.module').then(m => m.DashboardPageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'resident-dashboard',
    loadChildren: () => import('./resident/resident-dashboard/resident-dashboard.module').then( m => m.ResidentDashboardPageModule),canActivate:[AuthGuard, RoleGuard],
    data: { role: 'resident' }
  },
  {
    path: 'create-event',
    loadChildren: () => import('./events/create-event/create-event.module').then( m => m.CreateEventPageModule)
  },
  {
    path: 'event-list',
    loadChildren: () => import('./events/event-list/event-list.module').then( m => m.EventListPageModule)
  },
  {
    path: 'event',
    loadChildren: () => import('./admin/event/event.module').then( m => m.EventPageModule)
  },
  {
    path: 'settings',
    loadChildren: () => import('./admin/settings/settings.module').then( m => m.SettingsPageModule)
  },
  {
    path: 'user-management',
    loadChildren: () => import('./admin/user-management/user-management.module').then( m => m.UserManagementPageModule)
  },
  {
    path: 'manage-announcement',
    loadChildren: () => import('./admin/manage-announcement/manage-announcement.module').then( m => m.ManageAnnouncementPageModule)
  },
  {
    path: 'announcement-form',
    loadChildren: () => import('./admin/announcement-form/announcement-form.module').then( m => m.AnnouncementFormPageModule)
  },
  {
    path: 'announcement-detail',
    loadChildren: () => import('./admin/announcement-detail/announcement-detail.module').then( m => m.AnnouncementDetailPageModule)
  },
   // Announcements routes - Fixed
  {
    path: 'admin/manage-announcements',
    loadChildren: () => import('./admin/manage-announcement/manage-announcement.module').then( m => m.ManageAnnouncementPageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'admin/announcements/add',
    loadChildren: () => import('./admin/announcement-form/announcement-form.module').then( m => m.AnnouncementFormPageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'admin/announcements/edit/:id',
    loadChildren: () => import('./admin/announcement-form/announcement-form.module').then( m => m.AnnouncementFormPageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'admin/announcements/view/:id',
    loadChildren: () => import('./admin/announcement-detail/announcement-detail.module').then( m => m.AnnouncementDetailPageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' }
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
