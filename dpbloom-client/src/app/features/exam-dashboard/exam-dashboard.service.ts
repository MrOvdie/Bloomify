import { Injectable, inject } from '@angular/core';
import { forkJoin, Observable, throwError, map } from 'rxjs';
import {
  ExamsService,
  AttemptsService,
  ExamRecordDto,
  AttemptResultWithStatsDto
} from '../../core/api';

// Розширений інтерфейс для зручної роботи з UI
export interface AttemptWithMetadata {
  stats: AttemptResultWithStatsDto;
  durationInSeconds: number;
}

export interface ExamDashboardPageData {
  exam: ExamRecordDto;
  attempts: AttemptWithMetadata[];
}

@Injectable({ providedIn: 'root' })
export class ExamDashboardService {
  private examApi = inject(ExamsService);
  private attemptApi = inject(AttemptsService);

  getDashboardData(examId: string): Observable<ExamDashboardPageData> {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      console.error('Cannot find User ID in localStorage!');
      return throwError(() => new Error('User is not authenticated'));
    }

    return forkJoin({
      // Отримуємо загальну інформацію про тест
      exam: this.examApi.apiExamsOverviewExamIdGet(examId),
      // Отримуємо агреговані дані спроб зі статистикою
      attemptAggregate: this.attemptApi.apiAttemptsExamIdAttemptsStatsUserIdGet(examId, userId)
    }).pipe(
      map(data => {
        const attempts: AttemptWithMetadata[] = data.attemptAggregate.map(aggregateItem => {

          // Вираховуємо реальну тривалість на основі полів з examAttempt
          const startTime = aggregateItem.examAttempt?.startedAt
            ? new Date(aggregateItem.examAttempt.startedAt).getTime()
            : 0;

          const finishTime = aggregateItem.examAttempt?.finishedAt
            ? new Date(aggregateItem.examAttempt.finishedAt).getTime()
            : startTime; // Якщо finishedAt порожній (спроба ще триває), беремо startTime, щоб duration був 0

          const durationInSeconds = startTime > 0 ? (finishTime - startTime) / 1000 : 0;

          return {
            stats: aggregateItem,
            durationInSeconds: Math.round(durationInSeconds)
          };
        });

        return {
          exam: data.exam,
          attempts: attempts.sort((a, b) => {
            const timeA = a.stats.examAttempt?.startedAt
              ? new Date(a.stats.examAttempt.startedAt).getTime()
              : 0;

            const timeB = b.stats.examAttempt?.startedAt
              ? new Date(b.stats.examAttempt.startedAt).getTime()
              : 0;

            return timeB - timeA;
          })
        };
      })
    );
  }
}
