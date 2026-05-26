import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {NgOptimizedImage} from "@angular/common";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header implements OnInit {
  private router = inject(Router);

  userName: string | null = null;

  ngOnInit() {
    this.userName = localStorage.getItem('userName');
  }

  async goToUserProfile(){
    const success = await this.router.navigate(['/profile']);

    if (!success) {
      console.error('Cannot navigate to user profile.');
    }
  }

  async goToCourses(){
    const success = await this.router.navigate(['/courses']);

    if (!success) {
      console.error('Cannot navigate to courses.');
    }
  }
}
