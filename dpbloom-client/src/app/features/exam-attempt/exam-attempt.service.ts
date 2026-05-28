import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ExamsService,
  AttemptsService,
  SubmitAnswerDto,
  AttemptResultDto, ExamDetailsDto
} from '../../core/api';



@Injectable({ providedIn: 'root' })
export class ExamAttemptService {
  private examsApi = inject(ExamsService);
  private attemptsApi = inject(AttemptsService);

  getExamWithQuestions(examId: string): Observable<ExamDetailsDto> {
    // Підстав точну назву методу, який повертає питання тесту
    return this.examsApi.apiExamsIdGet(examId);
  }

  startAttempt(examId: string): Observable<any> {
    // Викликаємо твій [HttpPost("{examId:guid}/start")]
    return this.attemptsApi.apiAttemptsExamIdStartPost(examId);
  }

  submitAllAnswers(attemptId: string, answers: SubmitAnswerDto[]): Observable<void> {
    // Викликаємо твій [HttpPost("{attemptId:guid}/submit-all")]
    return this.attemptsApi.apiAttemptsAttemptIdSubmitAllPost(attemptId, answers);
  }

  finishAttempt(attemptId: string): Observable<AttemptResultDto> {
    // Викликаємо твій [HttpPost("{attemptId:guid}/finish")]
    return this.attemptsApi.apiAttemptsAttemptIdFinishPost(attemptId);
  }
}
