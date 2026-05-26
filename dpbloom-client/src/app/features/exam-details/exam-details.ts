import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TestService, TestPageData } from './exam-details.service';
import {DatePipe} from "@angular/common";

@Component({
  selector: 'app-test-details',
  standalone: true,
  templateUrl: './exam-details.html',
  imports: [
    DatePipe
  ],
  styleUrls: ['./exam-details.scss']
})
export class TestDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private testService = inject(TestService);

  data: TestPageData | null = null;
  isLoading = true;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.testService.getTestDashboardData(id).subscribe({
        next: (res) => {
          this.data = res;
          this.isLoading = false;
        },
        error: () => this.isLoading = false
      });
    }
  }
}
