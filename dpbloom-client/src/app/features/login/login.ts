import { Component, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  imports: [FormsModule]
})
export class Login implements OnInit {
  username = '';
  password = '';

  errorMessage = '';
  isLoading = false;
  returnUrl = '/courses';

  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/courses';
  }

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

        this.router.navigateByUrl(this.returnUrl);
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
