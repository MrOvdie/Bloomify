import {Component, inject, OnInit,} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: '/profile-header.html',
  styleUrls: ['../header/header.scss']
})
export class ProfileHeader implements OnInit {
  private router = inject(Router);

  userName: string | null = null;

  ngOnInit() {
    this.userName = localStorage.getItem('userName');
  }

  async goToCourses(){
    const success = await this.router.navigate(['/courses']);

    if (!success) {
      console.error('Cannot navigate to courses.');
    }
  }
}
