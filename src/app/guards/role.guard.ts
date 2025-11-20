import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const requiredRole = route.data['role'];

    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (user && user.role === requiredRole) {
          return true;
        } else {
          // Redirect based on user role or to login
          if (user) {
            if (user.role === 'admin') {
              this.router.navigate(['/admin-dashboard']);
            } else {
              this.router.navigate(['/user-dashboard']);
            }
          } else {
            this.router.navigate(['/login']);
          }
          return false;
        }
      })
    );
  }
}
