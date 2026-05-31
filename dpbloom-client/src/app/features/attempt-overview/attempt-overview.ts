import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AttemptOverviewAggregateDto} from "../../core/api";
import {AttemptOverviewService} from "./exam-overview.service";
import { NgClass } from '@angular/common';

export interface ViewOption {
  id: string;
  text: string;
  isSelected: boolean;
  isCorrect: boolean;
}

export interface ViewQuestion {
  id: string;
  text: string;
  type: string;
  bloomLevel: string;
  earnedScore: number;
  maxScore: number;
  options: ViewOption[];
  userAnswer: string | null;
}

@Component({
  selector: 'app-attempt-overview',
  standalone: true,
  templateUrl: './attempt-overview.html',
  imports: [
    NgClass
  ],
  styleUrls: ['./attempt-overview.scss']
})

export class AttemptOverviewComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private overviewService = inject(AttemptOverviewService);

  aggregateData?: AttemptOverviewAggregateDto;

  viewQuestions: ViewQuestion[] = [];

  isLoading = true;

  ngOnInit() {
    // Беремо ID спроби з URL (або передавай його інакше)
    const attemptId = this.route.snapshot.paramMap.get('attemptId');

    if (attemptId) {
      this.overviewService.getAttemptAggregate(attemptId).subscribe({
        next: (data) => {
          this.aggregateData = data;
          this.processAggregateData(data);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Помилка завантаження результатів', err);
          this.isLoading = false;
        }
      });
    }
  }

  closeResult() {
    // Безпечне повернення, якщо є examId
    const examId = this.aggregateData?.attemptResult?.examId;
    if (examId) {
      this.router.navigate(['/exam-dashboard', examId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  private processAggregateData(aggregate: AttemptOverviewAggregateDto) {
    const questions = aggregate.attemptDetails?.questions || [];
    const results = aggregate.attemptResult?.details || [];

    // Зберігаємо змаплені дані у змінну viewQuestions, яку чекає HTML
    this.viewQuestions = questions.map(q => {
      const result = results.find(r => r.questionId === q.id);

      const mappedOptions: ViewOption[] = (q.options || []).map(opt => {
        return {
          id: opt.id!,
          text: opt.text!,
          isSelected: result?.selectedOptionIds?.includes(opt.id!) || false,
          isCorrect: result?.correctOptionIds?.includes(opt.id!) || false
        };
      });

      return {
        id: q.id!,
        text: q.text!,
        type: q.type!,
        bloomLevel: q.level!,
        earnedScore: result?.score ?? 0,
        maxScore: result?.maxScore ?? 0,
        options: mappedOptions,
        userAnswer: result?.freeTextAnswer || null
      };
    });
  }

  getOptionClass(option: ViewOption): string {
    if (option.isCorrect && option.isSelected) return 'correct-selected';
    if (option.isCorrect && !option.isSelected) return 'correct-unselected';
    if (!option.isCorrect && option.isSelected) return 'incorrect-selected';
    return '';
  }

  formatTimeSpan(duration: string | null | undefined): string {
    if (!duration) return '00:00:00';

    return duration.split('.')[0];
  }
}

