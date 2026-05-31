import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AttemptsService as AttemptApi, AttemptOverviewAggregateDto } from '../../core/api';

@Injectable({
  providedIn: 'root'
})
export class AttemptOverviewService {
  private api = inject(AttemptApi);

  getAttemptAggregate(attemptId: string): Observable<AttemptOverviewAggregateDto> {
    return this.api.apiAttemptsAttemptIdResultGet(attemptId);
  }
}
