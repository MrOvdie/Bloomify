import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Lecture } from './lecture';

describe('Lecture', () => {
  let component: Lecture;
  let fixture: ComponentFixture<Lecture>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Lecture]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Lecture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
