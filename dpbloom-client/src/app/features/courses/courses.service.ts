import {Injectable, inject} from '@angular/core';
import {map, Observable, of, switchMap} from 'rxjs';
import {CourseService as ApiCourseService, AuthService as ApiAuthService, UpdateCourseDto} from '../../core/api';
import {CourseDto, CreateCourseDto, RegisterUserDto} from "../../core/api";

@Injectable({
  providedIn: 'root'
})
export class CoursesService {
  private apiCourseClient = inject(ApiCourseService);
  private apiAuthClient = inject(ApiAuthService)

  getDynamicCoursesData(userId: string): Observable<any[]> {

    return this.apiCourseClient.apiCourseEnrolledGet().pipe(
      switchMap(courses => {

        if (!courses || courses.length === 0) {
          return of([]);
        }

        const courseIds = courses.map(c => c.id as string);

        return this.apiCourseClient.apiCourseStatisticsAggregatedUserIdPost(userId, courseIds).pipe(
          map(statistics => {
            return courses.map(course => {
              const stat = statistics.find(s => s.courseId === course.id);

              return {
                ...course,
                score: stat ? stat.score : 0,
                courseCompletion: stat ? stat.courseCompletion : 0,
                examCompletion: stat ? stat.examCompletion : 0
              };
            });
          })
        );
      })
    );
  }

  getAdminCourseData(): Observable<CourseDto[]> {
    return this.apiCourseClient.apiCourseGet();
  }

  createCourse(payload: CreateCourseDto) {
    return this.apiCourseClient.apiCoursePost(payload);
  }

  updateCourse(courseId: string, payload: UpdateCourseDto): Observable<CourseDto> {
    return this.apiCourseClient.apiCourseIdPut(courseId, payload);
  }

  deleteCourse(courseId: string) {
    return this.apiCourseClient.apiCourseIdDelete(courseId);
  }

  registerStudent(payload: RegisterUserDto){
    return this.apiAuthClient.apiAuthRegisterPost(payload);
  }
}
