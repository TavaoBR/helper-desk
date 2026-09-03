import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { AuthService } from '../services/auth.service';

/**
 * Guard that checks if the user is authenticated and possesses a specific permission.
 */
export function permissionGuard(requiredPermission: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const perm = inject(PermissionService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (perm.can(requiredPermission)) {
      return true;
    }

    // Unauthorized: Redirect to safe home/tickets screen
    return router.createUrlTree(['/tickets']);
  };
}

/**
 * Guard that checks if the user possesses ANY of the specified permissions.
 */
export function anyPermissionGuard(permissions: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const perm = inject(PermissionService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (perm.canAny(permissions)) {
      return true;
    }

    return router.createUrlTree(['/tickets']);
  };
}
