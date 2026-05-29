import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ExamsService,
  AttemptsService,
  SubmitAnswerDto,
  AttemptResultDto, ExamDetailsDto, AttemptDetailsDto
} from '../../core/api';



@Injectable({ providedIn: 'root' })
export class ExamAttemptService {
  private examsApi = inject(ExamsService);
  private attemptsApi = inject(AttemptsService);

  getExamWithQuestions(examId: string): Observable<ExamDetailsDto> {
    return this.examsApi.apiExamsIdGet(examId);
  }

  startAttempt(examId: string): Observable<any> {
    return this.attemptsApi.apiAttemptsExamIdStartPost(examId);
  }

  submitCurrentAnswer(attemptId: string, answer: SubmitAnswerDto): Observable<void> {
    return this.attemptsApi.apiAttemptsAttemptIdSubmitPost(attemptId, answer);
  }

  submitAllAnswers(attemptId: string, answers: SubmitAnswerDto[]): Observable<void> {
    return this.attemptsApi.apiAttemptsAttemptIdSubmitAllPost(attemptId, answers);
  }

  finishAttempt(attemptId: string): Observable<AttemptResultDto> {
    return this.attemptsApi.apiAttemptsAttemptIdFinishPost(attemptId);
  }

  continueAttempt(attemptId: string) : Observable<AttemptDetailsDto>{
    return this.attemptsApi.apiAttemptsAttemptIdContinueGet(attemptId);
  }
}
