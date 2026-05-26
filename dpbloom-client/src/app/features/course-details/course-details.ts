import { Component, OnInit, inject } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { CourseDetailsService } from './course-details.service';
import { CourseAggregateDto } from '../../core/api';

@Component({
  selector: 'app-course-details',
  standalone: true,
  templateUrl: './course-details.html',
  styleUrls: ['./course-details.scss']
})
export class CourseDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private courseDetailsService = inject(CourseDetailsService);
  private router = inject(Router);

  course: CourseAggregateDto | null = null;
  isLoading = true;

  // Словник для збереження стану розгорнутих тем (ключ - ID теми, значення - чи розгорнуто)
  expandedTopics: Record<string, boolean> = {};

  ngOnInit() {
    this.expandedTopics['general'] = true;

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.courseDetailsService.getCourseDetails(id).subscribe(data => {
        // Отримуємо один об'єкт агрегату і повністю віддаємо його в шаблон
        this.course = data;
        this.isLoading = false;

        if (this.course?.topics && this.course.topics.length > 0) {
          this.expandedTopics[this.course.topics[0].id as string] = true;
        }
      });
    }
  }
  toggleTopic(topicId: string | undefined) {
    if (!topicId) return;
    this.expandedTopics[topicId] = !this.expandedTopics[topicId];
  }

  getLecturesForTopic(topicId: string | undefined) {
    if (!topicId || !this.course?.lectures) return [];
    return this.course.lectures.filter(l => l.topicId === topicId);
  }

  getExamsForTopic(topicId: string | undefined) {
    if (!topicId || !this.course?.exams) return [];
    return this.course.exams.filter(e => e.topicId === topicId);
  }

  hasGeneralContent(): boolean {
    const hasGeneralLectures = this.course?.lectures?.some(l => !l.topicId) ?? false;
    const hasGeneralExams = this.course?.exams?.some(e => !e.topicId) ?? false;
    return hasGeneralLectures || hasGeneralExams;
  }

  getGeneralLectures() {
    if (!this.course?.lectures) return [];
    return this.course.lectures.filter(l => !l.topicId);
  }

  getGeneralExams() {
    if (!this.course?.exams) return [];
    return this.course.exams.filter(e => !e.topicId);
  }

  async goToLecture(lectureId: string|undefined) {
    if (!lectureId) {
      console.error('Id of lecture is not provided.');
      return;
    }

    let success = await this.router.navigate(['/lecture-details', lectureId]);

    if (!success) {
      console.error('Cannot navigate to course details.');
    }
  }
}
