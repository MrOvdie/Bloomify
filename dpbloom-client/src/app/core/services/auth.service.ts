import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthService as ApiAuthService } from '../api/api/auth.service';
import {AuthResponseDto, LoginRequestDto} from '../api';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private apiAuthClient = inject(ApiAuthService);
  private readonly ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
  private readonly ID_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

  login(credentials: LoginRequestDto): Observable<AuthResponseDto> {
    return this.apiAuthClient.apiAuthLoginPost(credentials).pipe(
      tap((response: AuthResponseDto) => {
        localStorage.setItem('jwt_token', response.token ?? '');
        localStorage.setItem('userId', response.userId ?? '');
        localStorage.setItem('fullName', response.fullName ?? '');
        localStorage.setItem('userName', response.username ?? '');

        if (response.avatarUrl) {
          localStorage.setItem('userAvatar', response.avatarUrl);
        } else {
          localStorage.removeItem('userAvatar');
        }
      })
    );
  }

  private getParsedToken(): any {
    const token = localStorage.getItem('jwt_token');
    if (!token) return null;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  getUserId(): string | null {
    const payload = this.getParsedToken();
    if (!payload) return null;

    return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
      || payload.sub
      || payload.id
      || null;
  }

  hasTeacherOrAdminRole(): boolean {
    const payload = this.getParsedToken();
    if (!payload) return false;

    const roles = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role || [];

    const roleArray = Array.isArray(roles) ? roles : [roles];

    return roleArray.includes('Teacher') || roleArray.includes('Admin');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('jwt_token');
  }

  logout(): void {
    localStorage.clear();
  }

  private getDecodedToken(): any | null {
    const token = localStorage.getItem('jwt_token');
    if (!token) return null;

    try {
      const payloadBase64 = token.split('.')[1];
      return JSON.parse(atob(payloadBase64));
    } catch (error) {
      console.error('Помилка при декодуванні JWT токена:', error);
      return null;
    }
  }

  getUserRoles(): string[] {
    const decodedPayload = this.getDecodedToken();
    if (!decodedPayload) return [];

    const roles = decodedPayload[this.ROLE_CLAIM] || decodedPayload.role || [];
    return Array.isArray(roles) ? roles : [roles];
  }

  isTeacher(): boolean {
    return this.getUserRoles().includes('Teacher');
  }
  // Окремий метод для перевірки на адміна
  isAdmin(): boolean {
    return this.getUserRoles().includes('Admin');
  }

  getCurrentUserId(): string | null {
    const decodedPayload = this.getDecodedToken();
    return decodedPayload ? decodedPayload[this.ID_CLAIM] : null;
  }
}
