import {Routes} from '@angular/router';
import {Login} from './features/login/login';
import {Courses} from "./features/courses/courses";
import {CourseDetails} from "./features/course-details/course-details";
import {MainLayout} from "./core/layouts/main-layout/main-layout";
import {Profile} from "./features/profile/profile";
import {ProfileLayout} from "./core/layouts/profile-layout/profile-layout";
import {LectureDetails} from "./features/lecture/lecture";
import {ExamDashboard} from "./features/exam-dashboard/exam-dashboard";
import {ExamAttemptComponent} from "./features/exam-attempt/exam-attempt";
import {authGuard} from "./core/guards/auth.guard";
import {AttemptOverviewComponent} from "./features/attempt-overview/attempt-overview";
import {TeacherDashboardComponent} from "./features/teacher-exam-dashboard/teacher-exam-dashboard";

export const routes: Routes = [
  {path: 'login', component: Login},

  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {path: '', redirectTo: 'login', pathMatch: 'full'},
      {path: 'courses', component: Courses},
      {path: 'course-details/:courseId', component: CourseDetails},
      {
        path: 'teacher/course-details/:courseId',
        component: CourseDetails,
        data: { isTeacherMode: true }
      },

      {path: 'lecture-details/:lectureId', component: LectureDetails},
      {path: 'exam-dashboard/:examId', component: ExamDashboard},
      {
        path: 'teacher/student-exam-dashboard/:examId/:userId',
        component: ExamDashboard,
        data: {isTeacherMode: true}
      },

      {path: 'exam-attempt/:examId', component: ExamAttemptComponent},
      {path: 'attempt-overview/:attemptId', component: AttemptOverviewComponent},
      {path: 'teacher-exam-dashboard/:examId', component: TeacherDashboardComponent},
    ]
  },

  {
    path: 'profile',
    component: ProfileLayout,
    canActivate: [authGuard],
    children: [
      {path: '', component: Profile},
    ]
  },

  {path: '**', redirectTo: 'courses'},
];
