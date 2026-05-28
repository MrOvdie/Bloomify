import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LectureService } from './lecture.service';
import { LectureDetailsDto } from '../../core/api/';

@Component({
  selector: 'app-lecture-details',
  standalone: true,
  templateUrl: './lecture.html',
  styleUrls: ['./lecture.scss']
})
export class LectureDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private lectureService = inject(LectureService); // Використовуємо фасад

  lecture: LectureDetailsDto | null = null;
  isLoading = true;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('lectureId');
      if (id) {
        this.loadData(id);
      }
    });
  }

  private loadData(id: string) {
    this.lectureService.getLecturePageData(id).subscribe({
      next: (data) => {
        this.lecture = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }
}
