import {Component, OnInit, inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CourseDetailsService} from './course-details.service';
import {CourseAggregateDto, UpdateCourseDto, UpdateTopicDto} from '../../core/api';
import {AuthService} from "../../core/services/auth.service";
import { FormsModule } from '@angular/forms';
import {finalize, forkJoin, Observable} from "rxjs";
import {__await} from "tslib";

@Component({
  selector: 'app-course-details',
  standalone: true,
  templateUrl: './course-details.html',
  styleUrls: ['./course-details.scss'],
  imports: [
    FormsModule
  ],
})
export class CourseDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private courseDetailsService = inject(CourseDetailsService);
  private router = inject(Router);
  private authService = inject(AuthService);

  course: CourseAggregateDto | null = null;
  isLoading = true;
  isAuthorMode = false;

  isRemoveModalOpen = false;
  itemToRemove: { id: string, type: 'topic' | 'lecture' | 'exam' } | null = null;

  isTeacherMode = false;
  isAdminMode = false;

  isAddTopicModalOpen = false;
  newTopicTitle = '';
  newTopicDescription = '';

  expandedTopics: Record<string, boolean> = {};

  isEnrolModalOpen = false;
  enrolGroup = '';
  enrolUsername = '';
  enrolUsernamesList = '';
  isEnrolling = false;

  isEditCourseModalOpen = false;
  isUpdatingCourse = false;
  editCourseName = '';
  editCourseDescription = '';

  isEditTopicModalOpen = false;
  isUpdatingTopic = false;
  editTopicName = '';
  editTopicDescription = '';
  currentEditingTopicId: string | null = null;

  ngOnInit() {
    this.expandedTopics['general'] = true;
    this.isAuthorMode = this.route.snapshot.data['isAuthor'] || false;

    this.isTeacherMode = this.authService.isTeacher();
    this.isAdminMode = this.authService.isAdmin();

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
    if ((this.isAuthorMode && this.isTeacherMode) || this.isAdminMode) {
      success = await this.router.navigate(['/teacher-exam-dashboard', examId]);
    } else {
      success = await this.router.navigate(['/exam-dashboard', examId]);
    }

    if (!success) {
      console.error('Cannot navigate to exam dashboard.');
    }
  }

  openAddTopicModal() {
    this.newTopicTitle = '';
    this.newTopicDescription = '';
    this.isAddTopicModalOpen = true;
  }

  closeAddTopicModal() {
    this.isAddTopicModalOpen = false;
  }

  confirmAddTopic() {
    if (!this.newTopicTitle.trim()) {
      return;
    }

    const payload = {
      title: this.newTopicTitle,
      description: this.newTopicDescription
    };

    if (this.course?.id != null) {
      this.courseDetailsService.addTopic(this.course.id, payload).subscribe({
        next: (newTopic) => {
          if (!this.course!.topics) {
            this.course!.topics = [];
          }

          this.course!.topics.push(newTopic);

          this.closeAddTopicModal();
        },
        error: (err) => {
          console.error('Error during topic creation:', err);
        }
      });
    }
  }

  async addActivity(topicId: string | undefined) {
    if (!this.course?.id) {
      console.error('Cannot find course id');
      return;
    }

    await this.router.navigate(['/owner/add-activity', this.course.id], {
      queryParams: {topicId: topicId}
    });
  }

  private evaluateTeacherMode() {
    console.log('evaluateTeacherMode');

    const hasPrivilegedRole = this.authService.hasTeacherOrAdminRole();
    const currentUserId = this.authService.getUserId();

    const isCourseAuthor = currentUserId === this.course?.authorId;

    this.isAuthorMode = hasPrivilegedRole && isCourseAuthor;
  }

  removeTopic(topicId: string | undefined, event: Event) {
    event.stopPropagation();

    if (!topicId) {
      return;
    }

    this.itemToRemove = {id: topicId, type: 'topic'};
    this.isRemoveModalOpen = true;
  }

  removeActivity(activityId: string | undefined, activityType: 'lecture' | 'exam', event: Event) {
    event.stopPropagation();

    if (!activityId) {
      return;
    }

    this.itemToRemove = {id: activityId, type: activityType};
    this.isRemoveModalOpen = true;
  }

  closeRemoveModal() {
    this.isRemoveModalOpen = false;
    this.itemToRemove = null;
  }

  confirmRemove() {
    if (!this.itemToRemove) return;

    const {id, type} = this.itemToRemove;

    if (type === 'topic') {
      this.courseDetailsService.deleteTopic(id).subscribe(() => {
        if (this.course?.topics) {
          this.course.topics = this.course.topics.filter(t => t.id !== id);
        }
        this.closeRemoveModal();
      });
    } else if (type === 'lecture') {
      this.courseDetailsService.deleteLecture(id).subscribe(() => {
        if (this.course?.lectures) {
          this.course.lectures = this.course.lectures.filter(l => l.id !== id);
        }
        this.closeRemoveModal();
      });
    } else if (type === 'exam') {
      this.courseDetailsService.deleteExam(id).subscribe(() => {
        if (this.course?.exams) {
          this.course.exams = this.course.exams.filter(e => e.id !== id);
        }
        this.closeRemoveModal();
      });
    }
  }

  enrolStudents() {
    this.openEnrolModal();
  }

  openEnrolModal() {
    this.enrolGroup = '';
    this.enrolUsername = '';
    this.enrolUsernamesList = '';
    this.isEnrolModalOpen = true;
  }

  closeEnrolModal() {
    this.isEnrolModalOpen = false;
  }

  confirmEnrol() {
    if (!this.course?.id) {
      console.error('Course ID is missing');
      return;
    }

    const group = this.enrolGroup.trim();
    const singleUser = this.enrolUsername.trim();
    const multipleUsers = this.enrolUsernamesList
      .split(/[,\n]+/)
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (!group && !singleUser && multipleUsers.length === 0) {
      return;
    }

    this.isEnrolling = true;

    const requests: Observable<any>[] = [];

    if (group) {
      requests.push(this.courseDetailsService.enrollGroup(this.course.id, group));
    }

    if (singleUser) {
      requests.push(this.courseDetailsService.enrollStudent(this.course.id, singleUser));
    }

    if (multipleUsers.length > 0) {
      requests.push(this.courseDetailsService.enrollMultiple(this.course.id, multipleUsers));
    }

    forkJoin(requests)
      .pipe(finalize(() => {
        this.isEnrolling = false;
        this.closeEnrolModal();
      }))
      .subscribe({
        next: () => {
          console.log('Successful enrollment!');
        },
        error: (err) => {
          console.error('Error during enrollment:', err);
        }
      });
  }

  openEditCourseModal() {
    this.editCourseName = this.course?.title ?? '';
    this.editCourseDescription = this.course?.description ?? '';

    this.isEditCourseModalOpen = true;
  }

  closeEditCourseModal() {
    this.isEditCourseModalOpen = false;
  }

  confirmEditCourse() {
    if(!this.course?.id)
      return;

    if (!this.editCourseName.trim()) {
      alert('Course name is required!');
      return;
    }

    this.isUpdatingCourse = true;

    const payload: UpdateCourseDto = {
      title: this.editCourseName.trim(),
      description: this.editCourseDescription.trim()
    };

    this.courseDetailsService.updateCourse(this.course.id, payload).subscribe({
      next: (updatedCourse) => {
        if (this.course) {
          this.course.title = updatedCourse.title;
          this.course.description = updatedCourse.description;
        }

        this.isUpdatingCourse = false;
        this.closeEditCourseModal();
      },
      error: (err) => {
        console.error('Update course error:', err);
        this.isUpdatingCourse = false;
        alert('Failed to update course details.');
      }
    });
  }

  openEditTopicModal(topic: any, event: Event) {
    event.stopPropagation();
    this.currentEditingTopicId = topic.id;
    this.editTopicName = topic.title ?? '';
    this.editTopicDescription = topic.description ?? '';

    this.isEditTopicModalOpen = true;
  }

  closeEditTopicModal() {
    this.isEditTopicModalOpen = false;
    this.currentEditingTopicId = null;
  }

  confirmEditTopic() {
    if (!this.editTopicName.trim() || !this.currentEditingTopicId) {
      alert('Topic name is required!');
      return;
    }

    this.isUpdatingTopic = true;

    const payload: UpdateTopicDto = {
      title: this.editTopicName.trim(),
      description: this.editTopicDescription.trim()
    };

    this.courseDetailsService.updateTopic(this.currentEditingTopicId, payload).subscribe({
      next: (updatedTopicDto) => {
        const topicIndex = this.course?.topics?.findIndex(t => t.id === this.currentEditingTopicId);

        if (this.course?.topics && topicIndex !== undefined && topicIndex >= 0) {
          this.course.topics[topicIndex] = {
            ...this.course.topics[topicIndex],
            ...updatedTopicDto
          };
        }

        this.isUpdatingTopic = false;
        this.closeEditTopicModal();
      },
      error: (err) => {
        console.error('Update topic error:', err);
        this.isUpdatingTopic = false;
        alert('Failed to update topic.');
      }
    });
  }

  async goToEditActivity(type: 'lecture' | 'test', activityId: string, topicId: string | null = null) {
    if (!activityId) {
      console.error('Cannot edit activity: ID is missing');
      return;
    }

    if (!this.course?.id) {
      console.error('Cannot navigate: Course ID is missing');
      return;
    }

    await this.router.navigate(['/owner/add-activity', this.course.id], {
      queryParams: {
        topicId: topicId ?? 'general',
        mode: 'edit',
        type: type,
        activityId: activityId
      }
    });
  }
}
