import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { CourseService as ApiCourseService } from '../../core/api/api/course.service';
import { CourseAggregateDto } from '../../core/api';

@Injectable({
  providedIn: 'root'
})
export class CourseDetailsService {
  private apiCourseClient = inject(ApiCourseService);

  getCourseDetails(courseId: string): Observable<CourseAggregateDto | null> {
    return this.apiCourseClient.apiCourseContentCourseIdGet(courseId).pipe(
      catchError((err) => {
        console.error(`Course details loading error ${courseId}:`, err);
        return of(null);
      })
    );
  }
}
