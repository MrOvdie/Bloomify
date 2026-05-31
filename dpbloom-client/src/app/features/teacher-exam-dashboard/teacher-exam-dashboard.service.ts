import {Injectable, inject} from '@angular/core';
import {
  ExamsService,
  ExamRecordDto,
  AttemptsService,
  AttemptResultWithStatsDto
} from '../../core/api';
import {forkJoin, Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class TeacherExamDashboardService {
  private examApi = inject(ExamsService);
  private attemptApi = inject(AttemptsService)

  getTeacherDashboardData(examId: string): Observable<TeacherExamDashboardData> {
    return forkJoin({
      overview: this.examApi.apiExamsOverviewExamIdGet(examId),
      results: this.attemptApi.apiAttemptsExamIdExamResultsGet(examId)
    });
  }
}

export interface TeacherExamDashboardData {
  overview: ExamRecordDto;
  results: AttemptResultWithStatsDto[];
}

