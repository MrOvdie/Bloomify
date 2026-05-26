import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import {Courses} from "./features/courses/courses";
import {CourseDetails} from "./features/course-details/course-details";
import {MainLayout} from "./core/layouts/main-layout/main-layout";
import {Profile} from "./features/profile/profile";
import {ProfileLayout} from "./core/layouts/profile-layout/profile-layout";
import {LectureDetails} from "./features/lecture/lecture";

export const routes: Routes = [
  { path: 'login', component: Login },

  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'courses', component: Courses},
      { path: 'course-details/:id', component: CourseDetails},
      { path: 'lecture-details/:id', component: LectureDetails},
    ]
  },

  {
    path: 'profile',
    component: ProfileLayout,
    children: [
      { path: '', component: Profile },
    ]
  },

  { path: '**', redirectTo: 'courses' },
];
