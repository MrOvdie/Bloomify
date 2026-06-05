import {Component, OnInit, inject} from '@angular/core';
import {CoursesService} from './courses.service';
import {NgOptimizedImage} from "@angular/common";
import {Router} from "@angular/router";
import {AuthService} from "../../core/services/auth.service";
import {FormsModule} from "@angular/forms";
import {CreateCourseDto, RegisterUserDto} from "../../core/api";
import {finalize} from "rxjs";

@Component({
  selector: 'app-courses',
  standalone: true,
  templateUrl: './courses.html',
  imports: [
    NgOptimizedImage,
    FormsModule
  ],
  styleUrls: ['./courses.scss']
})
export class Courses implements OnInit {
  private coursesService = inject(CoursesService);

  coursesList: any[] = [];
  isLoading = true;

  isTeacherMode = false;
  isAdminMode = false;

  isAddCourseModalOpen = false;
  newCourseName = '';
  newCourseDescription = '';
  isCoursePublished = false;
  isSubmitting = false;

  currentUserId: string | null = null;
  isEditCourseModalOpen = false;
  isUpdatingCourse = false;
  editCourseName = '';
  editCourseDescription = '';
  editCoursePublishStatus = false;
  currentEditingCourseId: string | null = null;

  isRegisterModalOpen = false;
  isRegistering = false;
  regName = '';
  regMiddleName = '';
  regLastName = '';
  regEmail = '';
  regGroup = '';
  regFaculty = '';
  regEnteringDate = '';
  regGraduationDate = '';

  isDeleteModalOpen = false;
  courseIdToDelete: string | null = null;

  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    this.currentUserId = localStorage.getItem('userId') ?? '';

    this.isTeacherMode = this.authService.isTeacher();
    this.isAdminMode = this.authService.isAdmin();

    if (this.isAdminMode) {
      this.coursesService.getAdminCourseData()
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (data) => this.coursesList = data,
          error: (err) => console.error('Error during admin courses loading', err)
        });
    } else {
      this.coursesService.getDynamicCoursesData(this.currentUserId)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: (data) => this.coursesList = data,
          error: (err) => console.error('Error during courses loading', err)
        });
    }
  }


  async goToCourse(courseId: string) {
    const success = await this.router.navigate(['/course-details', courseId]);

    if (!success) {
      console.error('Cannot navigate to course details.');
    }
  }

  openAddCourseModal() {
    this.newCourseName = '';
    this.newCourseDescription = '';
    this.isAddCourseModalOpen = true;
  }

  closeAddCourseModal() {
    this.isAddCourseModalOpen = false;
  }

  confirmAddCourse() {
    if (!this.newCourseName.trim()) {
      return;
    }

    this.isSubmitting = true;

    const payload: CreateCourseDto = {
      title: this.newCourseName,
      description: this.newCourseDescription,
      isPublished: this.isCoursePublished
    };

    this.coursesService.createCourse(payload).subscribe({
      next: (newCourse) => {
        if (!this.coursesList) {
          this.coursesList = [];
        }

        this.coursesList.push(newCourse);

        this.isSubmitting = false;
        this.closeAddCourseModal();
      },
      error: (err) => {
        console.error('Error during course creating:', err);
        this.isSubmitting = false;
      }
    });
  }

  openRegisterModal() {
    this.regName = '';
    this.regMiddleName = '';
    this.regLastName = '';
    this.regEmail = '';
    this.regGroup = '';
    this.regFaculty = '';
    this.regEnteringDate = '';
    this.regGraduationDate = '';
    this.isRegisterModalOpen = true;
  }

  closeRegisterModal() {
    this.isRegisterModalOpen = false;
  }

  confirmRegisterStudent() {
    if (!this.regName.trim() || !this.regEmail.trim() || !this.regLastName.trim()) {
      alert('Name, Last name and Email are required!');
      return;
    }

    this.isRegistering = true;

    const group = this.regGroup.trim();
    const lastName = this.regLastName.trim();
    const firstName = this.regName.trim();
    const middleName = this.regMiddleName.trim();

    let autoPassword = `${group}_${lastName}_${firstName}`;
    if (middleName) {
      autoPassword += `_${middleName}`;
    }

    autoPassword = autoPassword.replace(/\s+/g, '');

    const payload: RegisterUserDto = {
      firstName: this.regName,
      middleName: this.regMiddleName,
      lastName: this.regLastName,
      email: this.regEmail,
      password: autoPassword,
      group: this.regGroup,
      faculty: this.regFaculty,
      enteringDate: this.regEnteringDate,
      graduationDate: this.regGraduationDate,
    };

    this.coursesService.registerStudent(payload).subscribe({
      next: () => {
        this.isRegistering = false;
        this.closeRegisterModal();
        alert(`Student successfully registered! Default password: ${autoPassword}`);
      },
      error: (err) => {
        console.error('Error during student registration:', err);
        this.isSubmitting = false;
      }
    });
  }

  deleteCourse(courseId: string, event: Event) {
    event.stopPropagation();
    this.courseIdToDelete = courseId;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.courseIdToDelete = null;
  }

  confirmDeleteCourse() {
    if (!this.courseIdToDelete) return;

    this.coursesService.deleteCourse(this.courseIdToDelete).subscribe({
      next: () => {
        this.coursesList = this.coursesList.filter(c => c.id !== this.courseIdToDelete);
        this.closeDeleteModal();
      },
      error: (err) => {
        console.error('Error during course deletion:', err);
      }
    });
  }

  openEditCourseModal(course: any, event: Event) {
    event.stopPropagation(); // Блокуємо перехід на сторінку деталей курсу

    this.currentEditingCourseId = course.id;
    this.editCourseName = course.title || '';
    this.editCourseDescription = course.description || '';
    this.editCoursePublishStatus = course.isPublished || false;

    this.isEditCourseModalOpen = true;
  }

  closeEditCourseModal() {
    this.isEditCourseModalOpen = false;
    this.currentEditingCourseId = null;
  }

  confirmEditCourse() {
    if (!this.editCourseName.trim() || !this.currentEditingCourseId) {
      alert('Course name is required!');
      return;
    }

    this.isUpdatingCourse = true;

    const payload = {
      title: this.editCourseName.trim(),
      description: this.editCourseDescription.trim(),
      isPublished: this.editCoursePublishStatus
    };

    this.coursesService.updateCourse(this.currentEditingCourseId, payload).subscribe({
      next: (updatedCourseDto) => {
        const index = this.coursesList.findIndex(c => c.id === this.currentEditingCourseId);

        if (index !== -1) {
          this.coursesList[index] = {
            ...this.coursesList[index],
            ...updatedCourseDto
          };
        }

        this.isUpdatingCourse = false;
        this.closeEditCourseModal();
      },
      error: (err) => {
        console.error('Updating course error:', err);
        this.isUpdatingCourse = false;
        alert('Failed to update course details.');
      }
    });
  }
}
