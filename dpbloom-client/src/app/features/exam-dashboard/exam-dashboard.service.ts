import { Injectable, inject } from '@angular/core';
import { forkJoin, Observable, throwError, map } from 'rxjs';
import {
  ExamsService,
  AttemptsService,
  ExamRecordDto,
  AttemptResultWithStatsDto, UserService
} from '../../core/api';

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
  private userService = inject(UserService)

  displayStudentName: string = 'Loading...';

  getDashboardData(examId: string, targetStudentId?: string | null): Observable<ExamDashboardPageData> {

    const userId = targetStudentId || localStorage.getItem('userId');

    if (!userId) {
      console.error('Cannot find User ID for dashboard!');
      return throwError(() => new Error('User is not identified'));
    }

    return forkJoin({
      exam: this.examApi.apiExamsOverviewExamIdGet(examId),
      attemptAggregate: this.attemptApi.apiAttemptsExamIdAttemptsStatsUserIdGet(examId, userId)
    }).pipe(
      map(data => {
        const attempts: AttemptWithMetadata[] = data.attemptAggregate.map(aggregateItem => {

          const startTime = aggregateItem.examAttempt?.startedAt
            ? new Date(aggregateItem.examAttempt.startedAt).getTime()
            : 0;

          const finishTime = aggregateItem.examAttempt?.finishedAt
            ? new Date(aggregateItem.examAttempt.finishedAt).getTime()
            : startTime;

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

  public loadStudentProfile(userId: string) {
    this.userService.apiUserBaseInfouserIdGet(userId).subscribe({
      next: (user) => {
        const group = user.group || 'Group';
        const lastName = user.lastName || 'Student';
        const firstName = user.firstName || '';
        const middleName = user.middleName || '';

        let initials = '';
        if (firstName) initials += `${firstName.charAt(0)}. `;
        if (middleName) initials += `${middleName.charAt(0)}.`;

        this.displayStudentName = `${group} | ${lastName} ${initials}`.trim();
      },
      error: () => {
        this.displayStudentName = 'Unknown student name';
      }
    });
  }
}
