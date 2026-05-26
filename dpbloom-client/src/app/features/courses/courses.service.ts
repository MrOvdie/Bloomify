import { Injectable, inject } from '@angular/core';
import { map, Observable, of, switchMap} from 'rxjs';
import { CourseService as ApiCourseService } from '../../core/api/api/course.service';

@Injectable({
  providedIn: 'root'
})
export class CoursesService {
  private apiCourseClient = inject(ApiCourseService);

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
}
