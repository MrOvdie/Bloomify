import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  imports: [FormsModule]
})

export class Login {
  username = '';
  password = '';

  errorMessage = '';
  isLoading = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  onLogin() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials = {
      loginDetails: this.username,
      password: this.password
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/courses']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401 || err.status === 400 || err.status === 403) {
          this.errorMessage = 'Invalid username or password. Please try again.';
        } else {
          this.errorMessage = 'Error occurred during login. Please try again later.';
        }
        console.error('Authorization error:', err);
      }
    });
  }
}
