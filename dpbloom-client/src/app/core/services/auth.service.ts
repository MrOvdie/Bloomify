import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthService as ApiAuthService } from '../api/api/auth.service';
import {AuthResponseDto, LoginRequestDto} from '../api';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private apiAuthClient = inject(ApiAuthService);

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

    // Шукаємо ID у стандартних клеймах .NET або коротких форматах
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
}
