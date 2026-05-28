import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ExamDashboardService, ExamDashboardPageData } from './exam-dashboard.service';
import { AttemptResultWithStatsDto, RecommendedMaterialDto } from '../../core/api';

@Component({
  selector: 'app-test-details',
  standalone: true,
  templateUrl: './exam-dashboard.html',
  imports: [DatePipe],
  styleUrls: ['./exam-dashboard.scss']
})
export class ExamDashboard implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private testService = inject(ExamDashboardService);

  data: ExamDashboardPageData | null = null;
  isLoading = true;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('examId');
    if (id) {
      this.testService.getDashboardData(id).subscribe({
        next: (res) => {
          this.data = res;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Exam dashboard loading error:', err);
          this.isLoading = false;
        }
      });
    }
  }

  getRecommendations(): RecommendedMaterialDto[] {
    if (!this.data?.attempts?.length) return [];

    return this.data.attempts[0].stats.bloomAnalytics?.recommendations ?? [];
  }

  formatDuration(seconds: number): string {
    if (seconds <= 0) return '00:00:00';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  getRadarPoints(stats: AttemptResultWithStatsDto): string {
    const center = 200;
    const maxRadius = 140;

    const bloomValues = [
      this.getBloomScore(stats, '1'), // KNOWING (Верх)
      this.getBloomScore(stats, '2'), // UNDERSTANDING (Верх-право)
      this.getBloomScore(stats, '3'), // APPLYING (Низ-право)
      this.getBloomScore(stats, '4'), // ANALYSING (Низ)
      this.getBloomScore(stats, '5'), // CREATING (Низ-ліво)
      this.getBloomScore(stats, '6')  // EVALUATING (Верх-ліво)
    ];

    const angles = [
      -Math.PI / 2,
      -Math.PI / 6,
      Math.PI / 6,
      Math.PI / 2,
      (5 * Math.PI) / 6,
      (7 * Math.PI) / 6
    ];

    return bloomValues.map((value, index) => {
      const radius = (value / 100) * maxRadius;
      const x = center + radius * Math.cos(angles[index]);
      const y = center + radius * Math.sin(angles[index]);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  private getBloomScore(stats: AttemptResultWithStatsDto, levelId: string): number {
    if (!stats.bloomAnalytics?.performanceByLevel) return 0;
    const metric = stats.bloomAnalytics.performanceByLevel.find(b => b.level === levelId);
    return metric?.scorePercentage ?? 0;
  }

  async startTest() {
    const examId = this.data?.exam.id;
    if (!examId) return;

    await this.router.navigate(['/exam-attempt', examId]);
  }

  checkAttemptResult(attemptResultId: string|undefined) {
    if (!attemptResultId) return;

    console.log('Перегляд результатів спроби:', attemptResultId);
    // this.router.navigate(['/attempt-result', attemptResultId]);
  }

  isExamAvailable(): boolean {
    if (!this.data?.exam) return false;

    const now = new Date().getTime();

    const startTime = this.data.exam.startsAt ? new Date(this.data.exam.startsAt).getTime() : 0;
    const finishTime = this.data.exam.finishesAt ? new Date(this.data.exam.finishesAt).getTime() : 0;

    if (startTime && now < startTime) {
      return false;
    }

    if (finishTime && now > finishTime) {
      return false;
    }

    return true;
  }

  get currentTimestamp(): number {
    return new Date().getTime();
  }

  canStartNewAttempt(): boolean {
    if (!this.data?.exam) return false;

    if (!this.isExamAvailable()) return false;

    const max = this.data.exam.attemptsCount;
    if (max && this.data.attempts.length >= max) {
      return false;
    }

    return true;
  }
}
