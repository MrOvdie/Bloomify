import {Injectable, inject} from '@angular/core';
import {Observable} from 'rxjs';
import {
  ExamsService as apiExamClient,
  LectureService as apiLecturesClient,
  CreateExamDto,
  CreateLectureDto,
  ExamDetailsDto, QuestionType, BloomLevel, PredictBloomRequestDto, LectureDetailsDto, UpdateLectureDto,
  ExamDetailsForUpdateDto
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

  getExam(examId: string): Observable<ExamDetailsForUpdateDto>{
    return this.examsApi.apiExamsUpdateDetailsIdGet(examId);
  }

  updateExam(examId: string, payload: CreateExamDto){
    return this.examsApi.apiExamsExamIdPut(examId, payload);
  }

  addLecture(courseId: string, payload: CreateLectureDto): Observable<any> {
    return this.lecturesApi.apiLectureCourseIdPost(courseId, payload);
  }

  getLecture(lectureId: string): Observable<LectureDetailsDto>{
    return this.lecturesApi.apiLectureIdGet(lectureId);
  }

  updateLecture(lectureId: string, payload: UpdateLectureDto){
    return this.lecturesApi.apiLectureIdPut(lectureId, payload);
  }

  evaluateQuestionBloomLevel(payload: PredictBloomRequestDto): Observable<BloomLevel> {
    return this.examsApi.apiExamsPredictBloomPost(payload);
  }
}
