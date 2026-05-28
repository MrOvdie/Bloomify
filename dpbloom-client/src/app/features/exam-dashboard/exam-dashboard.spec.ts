import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamDashboard } from './exam-dashboard';

describe('Exam', () => {
  let component: ExamDashboard;
  let fixture: ComponentFixture<ExamDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
