import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import {Courses} from "./features/courses/courses";
import {CourseDetails} from "./features/course-details/course-details";
import {MainLayout} from "./core/layouts/main-layout/main-layout";
import {Profile} from "./features/profile/profile";
import {ProfileLayout} from "./core/layouts/profile-layout/profile-layout";
import {LectureDetails} from "./features/lecture/lecture";
import {ExamDashboard} from "./features/exam-dashboard/exam-dashboard";
import {ExamAttemptComponent} from "./features/exam-attempt/exam-attempt";
import {authGuard} from "./core/guards/auth.guard";

export const routes: Routes = [
  { path: 'login', component: Login },

  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'courses', component: Courses},
      { path: 'course-details/:courseId', component: CourseDetails},
      { path: 'lecture-details/:lectureId', component: LectureDetails},
      { path: 'exam-dashboard/:examId', component: ExamDashboard},
      { path: 'exam-attempt/:examId', component: ExamAttemptComponent}
    ]
  },

  {
    path: 'profile',
    component: ProfileLayout,
    canActivate: [authGuard],
    children: [
      { path: '', component: Profile },
    ]
  },

  { path: '**', redirectTo: 'login' },
];
