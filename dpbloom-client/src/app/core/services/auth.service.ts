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

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('jwt_token');
  }

  logout(): void {
    localStorage.clear();
  }
}
