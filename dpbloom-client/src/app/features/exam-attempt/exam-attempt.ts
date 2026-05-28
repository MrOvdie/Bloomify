import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, forkJoin, Subscription, timer } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ExamAttemptService } from './exam-attempt.service';
import {QuestionDto, SubmitAnswerDto} from "../../core/api";

@Component({
  selector: 'app-test-attempt',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './exam-attempt.html',
  styleUrls: ['./exam-attempt.scss']
})
export class ExamAttemptComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private attemptService = inject(ExamAttemptService);

  examId = '';
  attemptId = '';
  questions: QuestionDto[] = [];

  // Словник для збереження відповідей: QuestionId -> значення
  // Для Single: рядок (OptionId)
  // Для Multi: масив рядків (OptionIds)
  // Для Open: рядок (текст)
  answers: Record<string, any> = {};

  // Таймер
  timeLeftSeconds = 1210; // Наприклад, 20 хвилин 10 секунд (отримуй з бекенду)
  formattedTime = '00:00:00';
  private timerSub?: Subscription;

  isLoading = true;
  isSubmitting = false;

  ngOnInit() {
    this.examId = this.route.snapshot.paramMap.get('examId') ?? '';
    if (!this.examId) return;

    // Спочатку отримуємо питання, потім стартуємо спробу (або паралельно)
    forkJoin({
      examDetails: this.attemptService.getExamWithQuestions(this.examId),
      startRes: this.attemptService.startAttempt(this.examId)
    }).subscribe({
      next: (res) => {
        this.questions = res.examDetails.questions || [];
        this.attemptId = res.startRes.attemptId;

        this.initAnswersMap();
        this.startTimer();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Помилка ініціалізації тесту:', err);
      }
    });
  }

  ngOnDestroy() {
    if (this.timerSub) this.timerSub.unsubscribe();
  }

  private initAnswersMap() {
    this.questions.forEach(q => {
      if (!q.id) return;

      const questionId = q.id;

      if (q.type === 'MultipleChoice') {
        this.answers[questionId] = [];
      } else {
        this.answers[questionId] = '';
      }
    });
  }

  toggleMultiChoice(questionId: string, optionId: string, isChecked: boolean) {
    const currentAnswers = this.answers[questionId] as string[];
    if (isChecked) {
      currentAnswers.push(optionId);
    } else {
      this.answers[questionId] = currentAnswers.filter(id => id !== optionId);
    }
  }

  isOptionChecked(questionId: string, optionId: string): boolean {
    return (this.answers[questionId] as string[]).includes(optionId);
  }

  private startTimer() {
    this.timerSub = timer(0, 1000).subscribe(() => {
      if (this.timeLeftSeconds <= 0) {
        this.timerSub?.unsubscribe();
        this.submitAndFinish();
        return;
      }
      this.timeLeftSeconds--;
      this.updateFormattedTime();
    });
  }

  private updateFormattedTime() {
    const h = Math.floor(this.timeLeftSeconds / 3600);
    const m = Math.floor((this.timeLeftSeconds % 3600) / 60);
    const s = this.timeLeftSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    this.formattedTime = `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  submitAndFinish() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const payload: SubmitAnswerDto[] = this.questions
      .filter(q => q.id !== undefined)
      .map(q => {
        const questionId = q.id!;
        const dto: SubmitAnswerDto = {questionId: questionId};

        if (q.type === 'SingleChoice') {
          dto.selectedOptionIds = this.answers[questionId] ? [this.answers[questionId]] : [];
        } else if (q.type === 'MultipleChoice') {
          dto.selectedOptionIds = this.answers[questionId] || [];
        } else if (q.type === 'OpenAnswer') {
          dto.freeTextAnswer = this.answers[questionId] || '';
        }

        return dto;
      });

    this.attemptService.submitAllAnswers(this.attemptId, payload).pipe(
      switchMap(() => this.attemptService.finishAttempt(this.attemptId))
    ).subscribe({
      next: () => {
        this.router.navigate(['/exam-dashboard', this.examId]);
      },
      error: (err) => {
        console.error('Помилка збереження спроби:', err);
        this.isSubmitting = false;
      }
    });
  }
}
