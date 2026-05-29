import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription, timer, switchMap, debounceTime } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ExamAttemptService } from './exam-attempt.service';
import {AttemptDetailsDto, QuestionDto, SubmitAnswerDto} from "../../core/api";

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
  private autoSaveSubject = new Subject<string>();
  private textSaveTimers: Record<string, any> = {};

  examId = '';
  attemptId = '';
  questions: QuestionDto[] = [];

  answers: Record<string, any> = {};

  // Таймер
  timeLeftSeconds = 1210;
  formattedTime = '00:00:00';
  private timerSub?: Subscription;

  isLoading = true;
  isSubmitting = false;
  attemptNumber: number | undefined;

  ngOnInit() {
    this.examId = this.route.snapshot.paramMap.get('examId') ?? '';
    const resumeAttemptId = this.route.snapshot.queryParamMap.get('resumeId');

    if (resumeAttemptId) {
      // ВАРІАНТ 1: Продовжуємо існуючу спробу (маємо ID з URL)
      this.loadAttemptData(resumeAttemptId);
    } else {
      // ВАРІАНТ 2: Створюємо нову спробу
      this.attemptService.startAttempt(this.examId).pipe(
        switchMap((response: any) => {

          const newAttemptId = response.attemptId ?? response;

          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { resumeId: newAttemptId },
            queryParamsHandling: 'merge',
            replaceUrl: true
          });

          // 2. Тепер викликаємо метод продовження, як і раніше
          return this.attemptService.continueAttempt(newAttemptId);
        })
      ).subscribe({
        next: (details: AttemptDetailsDto) => {
          this.initializeAttemptData(details);
          this.startTimer(details.startedAt, details.duration);
          this.isLoading = false;
        }
      });
      this.autoSaveSubject.pipe(
        // Чекаємо 800 мілісекунд після останньої зміни (ідеально для тексту)
        debounceTime(50)
      ).subscribe(questionId => {
        this.submitSingleAnswer(questionId);
      });
    }
  }

// Виносимо логіку завантаження в окремий метод, щоб не дублювати код
  private loadAttemptData(attemptId: string) {
    // Підстав правильну назву методу з NSwag для ContinueAttemptAsync
    this.attemptService.continueAttempt(attemptId).subscribe({
      next: (details: AttemptDetailsDto) => {
        this.initializeAttemptData(details);
        this.startTimer(details.startedAt, details.duration); // Передаємо час старту
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Помилка завантаження збереженої спроби:', err);
        this.isLoading = false;
      }
    });
  }
  private initializeAttemptData(attemptDetails: AttemptDetailsDto) {
    this.questions = attemptDetails.questions || [];
    this.attemptId = attemptDetails.id!;
    this.attemptNumber = attemptDetails.attemptNumber;

    this.questions.forEach(q => {
      if (!q.id) return;
      this.answers[q.id] = q.type === 'MultipleChoice' ? [] : '';
    });

    if (attemptDetails.savedAnswers) {
      attemptDetails.savedAnswers.forEach(saved => {
        if (!saved.questionId) return;

        const qId = saved.questionId;
        const question = this.questions.find(x => x.id === qId);

        if (!question) return;

        if (question.type === 'SingleChoice') {
          // Для SingleChoice беремо перший елемент масиву
          this.answers[qId] = saved.selectedOptionIds?.length ? saved.selectedOptionIds[0] : '';
        } else if (question.type === 'MultipleChoice') {
          // Для MultiChoice просто передаємо масив
          this.answers[qId] = saved.selectedOptionIds || [];
        } else if (question.type === 'OpenAnswer') {
          // Для тексту беремо freeTextAnswer
          this.answers[qId] = saved.freeTextAnswer || '';
        }
      });
    }
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

  toggleMultiChoice(questionId: string | undefined, optionId: string | undefined, isChecked: boolean) {
    if (!questionId || !optionId) return;

    const currentAnswers = (this.answers[questionId] as string[]) || [];
    if (isChecked) {
      if (!currentAnswers.includes(optionId)) {
        currentAnswers.push(optionId);
      }
    } else {
      this.answers[questionId] = currentAnswers.filter(id => id !== optionId);
    }

    // Додаємо виклик збереження!
    this.onOptionChange(questionId);
  }

  isOptionChecked(questionId: string, optionId: string): boolean {
    return (this.answers[questionId] as string[]).includes(optionId);
  }

  private startTimer(startedAt?: string, durationTimeSpan?: string) {
    if (this.timerSub) {
      this.timerSub.unsubscribe();
    }

    const totalDurationSeconds = this.parseTimeSpanToSeconds(durationTimeSpan) || 1200;

    if (startedAt) {
      let safeStartedAt = startedAt;
      if (!safeStartedAt.endsWith('Z')) {
        safeStartedAt += 'Z';
      }

      const startTime = new Date(safeStartedAt).getTime();
      const now = new Date().getTime();
      const passedSeconds = Math.floor((now - startTime) / 1000);
      this.timeLeftSeconds = totalDurationSeconds - passedSeconds;
    } else {
      this.timeLeftSeconds = totalDurationSeconds;
    }

    if (this.timeLeftSeconds <= 0) {
      this.timeLeftSeconds = 0;
      this.updateFormattedTime();
      this.submitAndFinish();
      return;
    }

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
        console.error('Final saving error:', err);
        this.isSubmitting = false;
      }
    });
  }

  private parseTimeSpanToSeconds(timeSpan?: string): number {
    if (!timeSpan) return 0;

    const parts = timeSpan.split(':');
    if (parts.length >= 3) {
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      // Використовуємо parseFloat для секунд, бо C# може надіслати мілісекунди (напр. "00:20:00.0000000")
      const seconds = parseFloat(parts[2]) || 0;

      return (hours * 3600) + (minutes * 60) + Math.floor(seconds);
    }

    return 0;
  }

  onAnswerChange(questionId: string) {
    this.autoSaveSubject.next(questionId);
  }

// А цей метод вже формує DTO і відправляє на бекенд
  private submitSingleAnswer(questionId: string) {
    if (!this.attemptId) return;

    const question = this.questions.find(q => q.id === questionId);
    if (!question) return;

    const dto: SubmitAnswerDto = { questionId: questionId };

    if (question.type === 'SingleChoice') {
      dto.selectedOptionIds = this.answers[questionId] ? [this.answers[questionId]] : [];
    } else if (question.type === 'MultipleChoice') {
      dto.selectedOptionIds = this.answers[questionId] || [];
    } else if (question.type === 'OpenAnswer') {
      dto.freeTextAnswer = this.answers[questionId] || '';
    }

    // Зверни увагу на правильну назву методу з NSwag (може бути apiAttemptsAttemptIdSubmitPost)
    this.attemptService.submitCurrentAnswer(this.attemptId, dto).subscribe({
      next: () => {
        console.log(`Відповідь на питання ${questionId} автоматично збережена.`);
      },
      error: (err) => {
        console.error(`Помилка автозбереження для ${questionId}:`, err);
      }
    });
  }

  onOptionChange(questionId: string) {
    this.submitSingleAnswer(questionId);
  }

  onTextChange(questionId: string) {
    // Якщо користувач продовжує друкувати в ЦЬОМУ Ж питанні - скидаємо таймер
    if (this.textSaveTimers[questionId]) {
      clearTimeout(this.textSaveTimers[questionId]);
    }

    // Заводимо новий таймер на 800мс тільки для цього питання
    this.textSaveTimers[questionId] = setTimeout(() => {
      this.submitSingleAnswer(questionId);
    }, 800);
  }


}
