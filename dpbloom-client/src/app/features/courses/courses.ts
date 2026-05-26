import { Component, OnInit, inject } from '@angular/core';
import { CoursesService } from './courses.service';
import {NgOptimizedImage} from "@angular/common";
import {Router} from "@angular/router";

@Component({
  selector: 'app-courses',
  standalone: true,
  templateUrl: './courses.html',
  imports: [
    NgOptimizedImage
  ],
  styleUrls: ['./courses.scss']
})
export class Courses implements OnInit {
  private coursesService = inject(CoursesService);

  coursesList: any[] = [];
  isLoading = true;

  private router = inject(Router);

  ngOnInit() {
    const userId = localStorage.getItem('userId') ?? '';


    this.coursesService.getDynamicCoursesData(userId).subscribe({
      next: (data) => {
        this.coursesList = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error during courses loading', err);
        this.isLoading = false;
      }
    });
  }

  async goToCourse(courseId: string) {
    const success = await this.router.navigate(['/course-details', courseId]);

    if (!success) {
      console.error('Cannot navigate to course details.');
    }
  }
}
