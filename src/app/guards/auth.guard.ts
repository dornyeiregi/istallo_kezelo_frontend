import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SettingsService } from '../services/settings.service';
import { EmployeeAccessSettingsDTO } from '../models/employee-access-settings.model';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const settingsService = inject(SettingsService);

  if (!authService.isLoggedIn()) {
    authService.setReturnUrl(state.url);
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  const requiredRoles = route.data?.['roles'] as string[] | undefined;
  if (requiredRoles && !authService.hasAnyRole(requiredRoles)) {
    router.navigate(['/stables']);
    return false;
  }

  const employeeSettingKey = route.data?.['employeeAccessSetting'] as
    | keyof EmployeeAccessSettingsDTO
    | undefined;
  if (employeeSettingKey && authService.hasAnyRole(['EMPLOYEE', 'ROLE_EMPLOYEE'])) {
    return settingsService.getEmployeeAccess().pipe(
      map((settings) => {
        const allowed = !!settings[employeeSettingKey];
        return allowed ? true : router.createUrlTree(['/']);
      }),
    );
  }

  return true;
};
