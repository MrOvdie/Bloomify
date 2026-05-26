import { Component, OnInit, } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: '/profile-header.html',
  styleUrls: ['../header/header.scss']
})
export class ProfileHeader implements OnInit {
  userName: string | null = null;

  ngOnInit() {
    this.userName = localStorage.getItem('userName');
  }
}
