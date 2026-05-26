import { Injectable, inject } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { ExamsService as ExamApiService} from '../../core/api/';
// Імпортуй відповідні DTO зі свого API
import { TestInfoDto, TestAttemptDto, RecommendationDto } from '../../core/api/models';

export interface TestPageData {
  info: TestInfoDto;
  attempts: TestAttemptDto[];
  recommendations: RecommendationDto[];
}

@Injectable({ providedIn: 'root' })
export class TestService {
  private testApi = inject(ExamApiService);

  getTestDashboardData(testId: string): Observable<TestPageData> {
    return forkJoin({
      info: this.testApi.apiTestIdGet(testId),
      attempts: this.testApi.apiTestAttemptsTestIdGet(testId),
      recommendations: this.testApi.apiTestRecommendationsTestIdGet(testId)
    });
  }
}
