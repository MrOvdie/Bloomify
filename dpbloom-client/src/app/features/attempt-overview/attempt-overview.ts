import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AttemptOverviewAggregateDto, AttemptStatus, TeacherEvaluationDto} from "../../core/api";
import {AttemptOverviewService} from "./attempt-overview.service";
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {AuthService} from "../../core/services/auth.service";
import {ExamDashboardService} from "../exam-dashboard/exam-dashboard.service";
import {state} from "@angular/animations";

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
  questionResultStatus: AttemptStatus;
  teacherComment: string | null;
}

@Component({
  selector: 'app-attempt-overview',
  standalone: true,
  templateUrl: './attempt-overview.html',
  imports: [
    NgClass,
    FormsModule
  ],
  styleUrls: ['./attempt-overview.scss']
})

export class AttemptOverviewComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private overviewService = inject(AttemptOverviewService);
  private testService = inject(ExamDashboardService);
  private authService = inject(AuthService);

  aggregateData?: AttemptOverviewAggregateDto;

  evaluationScores: Record<string, number> = {};
  evaluationComments: Record<string, string> = {};

  isTeacherMode = false;
  isAdminMode = false;
  isAuthor = false;

  studentId: string | null = null;
  examId: string | null = null;
  nameFromRoute: string | null = null;

  viewQuestions: ViewQuestion[] = [];

  isLoading = true;

  ngOnInit() {
    const attemptId = this.route.snapshot.paramMap.get('attemptId');

    this.isAuthor = this.route.snapshot.data['isAuthor'] || false;

    this.studentId = this.route.snapshot.paramMap.get('userId');

    this.nameFromRoute = history.state?.studentName || null;
    this.isTeacherMode = this.authService.isTeacher();
    this.isAdminMode = this.authService.isAdmin();

    if (this.nameFromRoute){
      this.testService.displayStudentName = this.nameFromRoute;
    } else if (this.studentId){
      this.testService.loadStudentProfile(this.studentId);
    }

    if (attemptId) {
      this.overviewService.getAttemptAggregate(attemptId).subscribe({
        next: (data) => {
          this.aggregateData = data;
          this.processAggregateData(data);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Results loading error', err);
          this.isLoading = false;
        }
      });
    }
  }

  async closeResult() {
    const examId = this.aggregateData?.attemptResult?.examId;
    const studentId = this.route.snapshot.paramMap.get('userId');

    if (examId) {
      if (this.isAuthor && studentId) {
        console.log('-> Перехід на OWNER дашборд');
        await this.router.navigate(['/owner/student-exam-dashboard', examId, studentId], {
          state: { studentName: this.nameFromRoute }
        });
      } else {
        console.warn('-> Перехід на загальний дашборд');
        await this.router.navigate(['/exam-dashboard', examId]);
      }
    } else {
      await this.router.navigate(['/']);
    }
  }

  private processAggregateData(aggregate: AttemptOverviewAggregateDto) {
    const questions = aggregate.attemptDetails?.questions || [];
    const results = aggregate.attemptResult?.details || [];

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
        userAnswer: result?.freeTextAnswer || null,
        questionResultStatus: result?.questionResultStatus || AttemptStatus.Checked,
        teacherComment: result?.comment || null
      };
    });
  }

  getOptionClass(option: ViewOption): string {
    const showResults = this.aggregateData?.attemptDetails?.showResults ?? true;

    const isStudent = !this.isAuthor && !this.isTeacherMode && !this.isAdminMode;

    if (isStudent && !showResults) {
      return option.isSelected ? 'selected-neutral' : '';
    }

    if (option.isCorrect && option.isSelected) return 'correct-selected';
    if (option.isCorrect && !option.isSelected) return 'correct-unselected';
    if (!option.isCorrect && option.isSelected) return 'incorrect-selected';
    return '';
  }

  formatTimeSpan(duration: string | null | undefined): string {
    if (!duration) return '00:00:00';

    return duration.split('.')[0];
  }

  submitEvaluation(questionId: string) {
    const score = this.evaluationScores[questionId];
    const comment = this.evaluationComments[questionId] || '';

    if (score === undefined || score === null) {
      alert('Please enter a score for this question.');
      return;
    }

    const question = this.viewQuestions.find(q => q.id === questionId);
    if (question && score > question.maxScore) {
      alert(`Score cannot be greater than maximal (${question.maxScore}).`);
      return;
    }

    const evaluationPayload: TeacherEvaluationDto = {
      questionId: questionId,
      awardedScore: score,
      comment: comment
    };

    const attemptResultId = this.aggregateData?.attemptResult?.id;
    if (!attemptResultId) return;

    this.overviewService.evaluateQuestion(attemptResultId, evaluationPayload).subscribe({
      next: () => {
        console.log(`Question ${questionId} evaluated successfully!`);

        if (question) {
          question.earnedScore = score;
          question.teacherComment = comment;
          question.questionResultStatus = AttemptStatus.Checked;
        }

        delete this.evaluationScores[questionId];
        delete this.evaluationComments[questionId];
      },
      error: (err) => {
        console.error('Помилка збереження оцінки:', err);
        alert('Не вдалося зберегти оцінку. Перевірте консоль.');
      }
    });
  }
}
