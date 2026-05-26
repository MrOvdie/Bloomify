import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamAttemp } from './exam-attempt';

describe('ExamAttemp', () => {
  let component: ExamAttemp;
  let fixture: ComponentFixture<ExamAttemp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamAttemp]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamAttemp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
