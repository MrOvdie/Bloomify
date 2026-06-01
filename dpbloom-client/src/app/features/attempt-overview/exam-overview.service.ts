import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {AttemptsService as AttemptApi, AttemptOverviewAggregateDto, TeacherEvaluationDto} from '../../core/api';

@Injectable({
  providedIn: 'root'
})
export class AttemptOverviewService {
  private api = inject(AttemptApi);

  getAttemptAggregate(attemptId: string): Observable<AttemptOverviewAggregateDto> {
    return this.api.apiAttemptsAttemptIdResultGet(attemptId);
  }

  evaluateQuestion(attemptId: string, payload: TeacherEvaluationDto): Observable<any> {
    return this.api.apiAttemptsReviewAttemptResultIdPost(attemptId, payload);
  }
}
