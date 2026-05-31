import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttemptOverview } from './attempt-overview';

describe('AttemptOverview', () => {
  let component: AttemptOverview;
  let fixture: ComponentFixture<AttemptOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttemptOverview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttemptOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
