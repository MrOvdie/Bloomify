import {Component, OnInit, inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CourseDetailsService} from './course-details.service';
import {CourseAggregateDto} from '../../core/api';
import {AuthService} from "../../core/services/auth.service";

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
  private authService = inject(AuthService);

  course: CourseAggregateDto | null = null;
  isLoading = true;
  isTeacherMode = false;

  isRemoveModalOpen = false;
  itemToRemove: { id: string, type: 'topic' | 'lecture' | 'exam' } | null = null;

  expandedTopics: Record<string, boolean> = {};

  ngOnInit() {
    this.expandedTopics['general'] = true;
    this.isTeacherMode = this.route.snapshot.data['isTeacherMode'] || false;

    const id = this.route.snapshot.paramMap.get('courseId');
    if (id) {
      this.courseDetailsService.getCourseDetails(id).subscribe(data => {
        this.course = data;
        this.isLoading = false;

        this.evaluateTeacherMode();

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

  async goToLecture(lectureId: string | undefined) {
    if (!lectureId) {
      console.error('Id of lecture is not provided.');
      return;
    }

    let success = await this.router.navigate(['/lecture-details', lectureId]);

    if (!success) {
      console.error('Cannot navigate to lecture details.');
    }
  }

  async goToExamDashboard(examId: string | undefined) {
    if (!examId) {
      console.error('Id of exam is not provided.');
      return;
    }

    let success = false;
    if (this.isTeacherMode) {
      success = await this.router.navigate(['/teacher-exam-dashboard', examId]);
    } else {
      success = await this.router.navigate(['/exam-dashboard', examId]);
    }

    if (!success) {
      console.error('Cannot navigate to exam dashboard.');
    }
  }

  enrolStudents() {
    // Відкриття модалки додавання студентів
    console.log('Open enrol modal');
  }

  addTopic() {
    console.log('Add new topic');
  }

  addActivity(topicId: string | undefined) {
    console.log('Add activity to topic', topicId);
  }

  private evaluateTeacherMode() {
    console.log('evaluateTeacherMode');

    const hasPrivilegedRole = this.authService.hasTeacherOrAdminRole();
    const currentUserId = this.authService.getUserId();

    const isCourseAuthor = currentUserId === this.course?.authorId;

    this.isTeacherMode = hasPrivilegedRole && isCourseAuthor;
  }

  removeTopic(topicId: string | undefined, event: Event) {
    event.stopPropagation();

    if (!topicId) {
      return;
    }

    this.itemToRemove = { id: topicId, type: 'topic' };
    this.isRemoveModalOpen = true;
  }

  removeActivity(activityId: string | undefined, activityType: 'lecture' | 'exam', event: Event) {
    event.stopPropagation();

    if (!activityId) {
      return;
    }

    this.itemToRemove = { id: activityId, type: activityType };
    this.isRemoveModalOpen = true;
  }

  openRemoveModal(id: string, type: 'topic' | 'lecture' | 'exam', event: Event) {
    event.stopPropagation();
    this.itemToRemove = { id, type };
    this.isRemoveModalOpen = true;
  }

  closeRemoveModal() {
    this.isRemoveModalOpen = false;
    this.itemToRemove = null;
  }

  confirmRemove() {
    if (!this.itemToRemove) return;

    const { id, type } = this.itemToRemove;

    if (type === 'topic') {
      this.courseDetailsService.deleteTopic(id).subscribe(() => {
        if (this.course?.topics) {
          this.course.topics = this.course.topics.filter(t => t.id !== id);
        }
        this.closeRemoveModal();
      });
    }
    else if (type === 'lecture') {
      this.courseDetailsService.deleteLecture(id).subscribe(() => {
        if (this.course?.lectures) {
          this.course.lectures = this.course.lectures.filter(l => l.id !== id);
        }
        this.closeRemoveModal();
      });
    }
    else if (type === 'exam') {
      this.courseDetailsService.deleteExam(id).subscribe(() => {
        if (this.course?.exams) {
          this.course.exams = this.course.exams.filter(e => e.id !== id);
        }
        this.closeRemoveModal();
      });
    }
  }
}
