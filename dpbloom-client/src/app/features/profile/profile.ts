import { Component, OnInit, inject, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NgOptimizedImage, DatePipe } from '@angular/common';
import Chart from 'chart.js/auto';

import {CombinedProfileData, ProfileService} from './profile.service';
import { UserProfileDto, GlobalUserDashboardDto } from '../../core/api';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [NgOptimizedImage, DatePipe],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile implements OnInit, OnDestroy {
  private profileService = inject(ProfileService);
  private cdr = inject(ChangeDetectorRef);

  userProfile: UserProfileDto | null = null;
  userStats: GlobalUserDashboardDto | null = null;
  isLoading = true;

  private charts: Chart[] = [];

  @ViewChild('scoreCanvas') scoreCanvas!: ElementRef;
  @ViewChild('completionCanvas') completionCanvas!: ElementRef;
  @ViewChild('radarCanvas') radarCanvas!: ElementRef;

  ngOnInit() {
    this.profileService.getFullProfileData().subscribe({
      next: (data) => {
        this.userProfile = data.profile;
        this.userStats = data.stats;
        this.isLoading = false;

        this.cdr.detectChanges();

        this.initAllCharts();
      },
      error: (err) => {
        console.error('Помилка завантаження даних:', err);
        this.isLoading = false;
      }
    });
  }

  private getBloomScore(levelId: string): number {
    if (!this.userStats?.bloomPerformance) return 0;

    const metric = this.userStats.bloomPerformance.find(b => b.level === levelId);

    return metric?.scorePercentage ?? 0;
  }

  private initAllCharts() {
    if (!this.userStats) return;

    const score = this.userStats.averageCourseScore ?? 0;
    const completion = this.userStats.averageExamCompletion ?? 0;

    if (this.scoreCanvas) {
      const scoreChart = new Chart(this.scoreCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [score, 100 - score],
            backgroundColor: ['#ff9a9e', '#f3f3f3'],
            borderWidth: 0
          }]
        },
        options: this.getDoughnutOptions()
      });
      this.charts.push(scoreChart);
    }

    if (this.completionCanvas) {
      const completionChart = new Chart(this.completionCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [completion, 100 - completion],
            backgroundColor: ['#889cff', '#f3f3f3'],
            borderWidth: 0
          }]
        },
        options: this.getDoughnutOptions()
      });
      this.charts.push(completionChart);
    }

    // 3. Радарна діаграма таксономії Блума
    if (this.radarCanvas) {
      const radarChart = new Chart(this.radarCanvas.nativeElement, {
        type: 'radar',
        data: {
          labels: ['KNOWING', 'UNDERSTANDING', 'APPLYING', 'ANALYSING', 'CREATING', 'EVALUATING'],
          datasets: [{
            data: [
              this.getBloomScore('Knowing'),
              this.getBloomScore('Understanding'),
              this.getBloomScore('Applying'),
              this.getBloomScore('Analyzing'),
              this.getBloomScore('Creating'),
              this.getBloomScore('Evaluating')
            ],
            backgroundColor: 'rgba(162, 217, 206, 0.6)',
            borderColor: '#5b9b8e',
            pointBackgroundColor: '#5b9b8e',
            pointBorderColor: '#fff',
            borderWidth: 2,
            fill: true,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            r: {
              min: 0,
              max: 100,
              angleLines: { color: '#ff9eb5' },
              grid: { color: '#ff9eb5', circular: true },
              pointLabels: { color: '#111', font: { family: 'Georgia', size: 11 } },
              ticks: { display: false, }
            }
          }
        }
      });
      this.charts.push(radarChart);
    }
  }

  private getDoughnutOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '85%',
      plugins: { legend: { display: false }, tooltip: { enabled: false } }
    };
  }

  ngOnDestroy() {
    // Чистимо пам'ять від графіків при переході на іншу сторінку
    this.charts.forEach(chart => chart.destroy());
  }

  editProfile() {
    console.log('Редагування профілю...');
  }
}
