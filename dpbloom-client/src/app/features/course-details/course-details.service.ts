import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { CourseService as ApiCourseService } from '../../core/api/api/course.service';
import { CourseAggregateDto, ExamsService, LectureService, TopicService, CreateTopicDto} from '../../core/api';

@Injectable({
  providedIn: 'root'
})
export class CourseDetailsService {
  private apiCourseClient = inject(ApiCourseService);
  private apiTopicClient = inject(TopicService);
  private apiLectureClient = inject(LectureService);
  private apiExamClient = inject(ExamsService)

  getCourseDetails(courseId: string): Observable<CourseAggregateDto | null> {
    return this.apiCourseClient.apiCourseContentCourseIdGet(courseId).pipe(
      catchError((err) => {
        console.error(`Course details loading error ${courseId}:`, err);
        return of(null);
      })
    );
  }

  enrollStudent(courseId: string, userName: string){
    return this.apiCourseClient.apiCourseCourseIdEnrollUserNamePost(courseId, userName);
  }

  enrollMultiple(courseId: string, userNames: string[]){
    return this.apiCourseClient.apiCourseCourseIdEnrollMultiplePost(courseId, userNames);
  }

  enrollGroup(courseId: string, groupName: string){
    return this.apiCourseClient.apiCourseCourseIdEnrollGroupGroupPost(courseId, groupName);
  }

  addTopic(courseId: string, payload: CreateTopicDto){
    return this.apiTopicClient.apiTopicCourseIdPost(courseId, payload)
  }

  deleteTopic(topicId: string) {
    return this.apiTopicClient.apiTopicIdDelete(topicId)
  }

  deleteLecture(lectureId: string) {
    return this.apiLectureClient.apiLectureIdDelete(lectureId);
  }

  deleteExam(examId: string) {
    return this.apiExamClient.apiExamsIdDelete(examId);
  }
}
