import {Injectable, inject} from '@angular/core';
import {Observable} from 'rxjs';
import {
  ExamsService as apiExamClient,
  LectureService as apiLecturesClient,
  CreateExamDto,
  CreateLectureDto,
  ExamDetailsDto, QuestionType, BloomLevel, PredictBloomRequestDto
} from '../../core/api';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private examsApi = inject(apiExamClient);
  private lecturesApi = inject(apiLecturesClient);

  addExam(courseId: string, payload: CreateExamDto): Observable<any> {
    return this.examsApi.apiExamsCourseIdPost(courseId, payload);
  }

  addLecture(courseId: string, payload: CreateLectureDto): Observable<any> {
    return this.lecturesApi.apiLectureCourseIdPost(courseId, payload);
  }

  evaluateQuestionBloomLevel(payload: PredictBloomRequestDto): Observable<BloomLevel> {
    return this.examsApi.apiExamsPredictBloomPost(payload);
  }
}
