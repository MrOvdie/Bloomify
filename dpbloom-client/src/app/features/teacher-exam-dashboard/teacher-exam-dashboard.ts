import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {TeacherExamDashboardData, TeacherExamDashboardService} from "./teacher-exam-dashboard.service";

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-exam-dashboard.html',
  styleUrls: ['./teacher-exam-dashboard.scss']
})
export class TeacherDashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dashboardService = inject(TeacherExamDashboardService);

  data: TeacherExamDashboardData | null = null;
  isLoading = true;

  avgScoreValue = 0;
  avgScorePercentage = 0;
  avgDurationInSeconds = 0;
  studentsPassedCount = 0;
  totalStudentsCompleted = 0;

  ngOnInit() {
    const examId = this.route.snapshot.paramMap.get('examId');
    if (examId) {
      this.dashboardService.getTeacherDashboardData(examId).subscribe({
        next: (res) => {
          this.data = res;
          this.calculateAnalytics();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Помилка завантаження дашборду викладача:', err);
          this.isLoading = false;
        }
      });
    }
  }

  private calculateAnalytics() {
    if (!this.data || !this.data.results.length) return;

    const aggregatedAttempts = this.data.results;
    this.totalStudentsCompleted = aggregatedAttempts.length;

    let totalScore = 0;
    let totalMaxScore = 0;
    let totalPercentage = 0;
    let totalDuration = 0;
    let passedCount = 0;

    aggregatedAttempts.forEach(aggregate => {
      // Звертаємося до вкладених сутностей агрегату
      const result = aggregate.attemptResult;
      const details = aggregate.bloomAnalytics;

      totalScore += result?.score || 0;
      totalMaxScore += result?.maxScore || 0;
      totalPercentage += result?.scorePercentage || 0;

      // Тривалість беремо з деталей
      totalDuration += this.parseDurationToSeconds(aggregate.attemptResult?.duration);

      if (result?.passed) passedCount++;
    });

    this.avgScoreValue = totalMaxScore > 0 ? (totalScore / aggregatedAttempts.length) : 0;
    this.avgScorePercentage = aggregatedAttempts.length > 0 ? (totalPercentage / aggregatedAttempts.length) : 0;
    this.avgDurationInSeconds = aggregatedAttempts.length > 0 ? (totalDuration / aggregatedAttempts.length) : 0;
    this.studentsPassedCount = passedCount;
  }

  private getAverageBloomScore(levelName: string): number {
    if (!this.data?.results) return 0;

    let totalScore = 0;
    let validAttemptsCount = 0;

    this.data.results.forEach(aggregate => {
      // Тепер аналітика легально лежить в об'єкті агрегату
      const stats = aggregate.bloomAnalytics?.performanceByLevel;

      if (stats) {
        const metric = stats.find(b => b.level?.toLowerCase() === levelName.toLowerCase());
        if (metric) {
          totalScore += metric.scorePercentage || 0;
        }
        validAttemptsCount++;
      }
    });

    return validAttemptsCount > 0 ? (totalScore / validAttemptsCount) : 0;
  }

  formatDuration(seconds: number): string {
    if (seconds <= 0) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }


  getRadarPoints(): string {
    const center = 200;
    const maxRadius = 140;

    const bloomValues = [
      this.getAverageBloomScore('Knowing'),
      this.getAverageBloomScore('Understanding'),
      this.getAverageBloomScore('Applying'),
      this.getAverageBloomScore('Analyzing'),
      this.getAverageBloomScore('Creating'),
      this.getAverageBloomScore('Evaluating')
    ];

    const angles = [
      -Math.PI / 2, -Math.PI / 6, Math.PI / 6,
      Math.PI / 2, (5 * Math.PI) / 6, (7 * Math.PI) / 6
    ];

    return bloomValues.map((value, index) => {
      const effectiveValue = Math.max(value, 12);
      const radius = (effectiveValue / 100) * maxRadius;
      const x = center + radius * Math.cos(angles[index]);
      const y = center + radius * Math.sin(angles[index]);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  async checkAttemptDetails(aggregate: any) {
    const userId = aggregate.examAttempt?.userId;
    const examId = this.data?.overview.id;

    if (!userId || !examId) return;

    const studentFullName = this.formatStudentName(aggregate);

    await this.router.navigate(['/teacher/student-exam-dashboard', examId, userId], {
      state: { studentName: studentFullName }
    });
  }

  private parseDurationToSeconds(val: string | number | undefined | null): number {
    if (!val) return 0;

    if (typeof val === 'number') return val;

    if (typeof val === 'string') {
      if (val.includes(':')) {
        const parts = val.split(':');
        let secs = 0;
        if (parts.length === 3) {
          secs = (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]); // Години:Хвилини:Секунди
        } else if (parts.length === 2) {
          secs = (+parts[0]) * 60 + (+parts[1]); // Хвилини:Секунди
        }
        return isNaN(secs) ? 0 : secs;
      }

      return Number(val) || 0;
    }

    return 0;
  }

  formatStudentName(aggregate: any): string {
    const group = aggregate.examAttempt?.userGroup || 'Group';
    const lastName = aggregate.examAttempt?.lastName || 'Student';
    const firstName = aggregate.examAttempt?.firstName || '';
    const middleName = aggregate.examAttempt?.middleName || '';

    let initials = '';
    if (firstName) initials += `${firstName.charAt(0)}. `;
    if (middleName) initials += `${middleName.charAt(0)}.`;

    return `${group} | ${lastName} ${initials}`.trim();
  }
}
