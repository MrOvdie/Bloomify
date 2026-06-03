import {Component, OnInit, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {
  CreateLectureDto,
  CreateExamDto,
  CreateQuestionDto,
  QuestionType,
  BloomLevel,
  CheckingType,
  PredictBloomRequestDto,
  CreateOptionDto,
  EvaluationStrategy
} from '../../core/api';
import {ActivityService} from "./add-activity.service";
import {catchError, debounceTime, filter, map, of, Subject, Subscription, switchMap, tap} from "rxjs";

@Component({
  selector: 'app-add-activity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-activity.html',
  styleUrls: ['./add-activity.scss']
})
export class AddActivityComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private activityService = inject(ActivityService)

  courseId: string | null = null;
  topicId: string | null = null;

  durationHours: number | null = null;
  durationMinutes: number | null = null;
  durationSeconds: number | null = null;

  activityType: 'lecture' | 'test' = 'lecture';

  lectureData: CreateLectureDto = {
    title: '',
    description: '',
    content: '',
    contentLinks: []
  };

  testData: CreateExamDto = {
    title: '',
    description: '',
    duration: '',
    startsAt: '',
    topicId: '',
    finishesAt: '',
    evaluationStrategy: EvaluationStrategy.Best,
    attemptsCount: 1,
    minimalPassScore: 0,
    isRandomOrder: false,
    canCheckAttempts: false,
    canSkip: false,
    questions: [
      this.createEmptyQuestion()
    ],
  };

  private questionInput$ = new Subject<{ index: number, text: string }>();
  private aiSubscription!: Subscription;
  analyzingQuestions: { [index: number]: boolean } = {};
  aiSuccessStatus: { [index: number]: boolean } = {};
  isLevelManuallyOverridden: { [index: number]: boolean } = {};

  ngOnInit() {
    const paramCourseId = this.route.snapshot.paramMap.get('courseId');
    if (paramCourseId) {
      this.courseId = paramCourseId;
    }

    const queryCourseId = this.route.snapshot.queryParamMap.get('courseId');
    if (queryCourseId) {
      this.courseId = queryCourseId;
    }

    const queryTopicId = this.route.snapshot.queryParamMap.get('topicId');
    if (queryTopicId) {
      this.topicId = queryTopicId;
    }

    console.log('Initializing component. Course ID:', this.courseId, '| Topic ID:', this.topicId);


    this.aiSubscription = this.questionInput$.pipe(
      debounceTime(800),
      filter(data => data.text.trim().length > 10),
      tap(data => this.analyzingQuestions[data.index] = true),
      switchMap(data => {
        const payload: PredictBloomRequestDto = {
          questionText: data.text
        };

        return this.activityService.evaluateQuestionBloomLevel(payload).pipe(
          map(response => ({ index: data.index, level: response, success: true })),
          catchError(err => {
            console.error('ANN analysis error:', err);
            return of({ index: data.index, level: null, success: false });
          })
        );
      })
    ).subscribe(result => {
      this.analyzingQuestions[result.index] = false;

      if (result.success && result.level !== null && this.testData.questions) {
        const mappedLevel = this.mapAnnLevelToEnum(result.level);

        if (mappedLevel) {
          this.testData.questions[result.index].level = mappedLevel as any;
          this.aiSuccessStatus[result.index] = true;
          this.isLevelManuallyOverridden[result.index] = false;
        }
      } else {
        this.aiSuccessStatus[result.index] = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.aiSubscription) {
      this.aiSubscription.unsubscribe();
    }
  }

  onQuestionTextChanged(index: number, text: string) {
    this.questionInput$.next({ index, text });
  }

  private mapAnnLevelToEnum(aiLevel: string | number): number {
    if (!aiLevel) return 1;

    const levelStr = String(aiLevel).replace(/['"]/g, '').toLowerCase().trim();

    switch (levelStr) {
      case 'knowing': case '0': case '1':
        return 1;
      case 'understanding': case '2':
        return 2;
      case 'applying': case '3':
        return 3;
      case 'analyzing': case '4':
        return 4;
      case 'creating': case '5':
        return 5;
      case 'evaluating': case '6':
        return 6;
      default:
        console.warn('ШІ повернув невідомий рівень:', aiLevel);
        return 1;
    }
  }

  createEmptyQuestion(): CreateQuestionDto {
    return {
      text: '',
      type: QuestionType.SingleChoice,
      scoreWeight: 1,
      checkingType: CheckingType.Automatic,
      level: BloomLevel.Knowing,
      options: [
        this.createEmptyOption()
      ]
    };
  }

  createEmptyOption(): CreateOptionDto {
    return {
      text: '',
      isCorrect: false
    }
  }

  addQuestion() {
    if (!this.testData.questions) {
      this.testData.questions = [];
    }

    this.testData.questions.push(this.createEmptyQuestion());
  }

  addOption(questionIndex: number) {
    if (!this.testData.questions) {
      return;
    }

    const question = this.testData.questions[questionIndex];

    if (!question.options) {
      question.options = [];
    }

    question.options.push(this.createEmptyOption());
  }


  saveAndCreate() {
    if (!this.courseId) {
      console.error('Неможливо зберегти: Course ID відсутній!');
      return;
    }

    const finalTopicId = this.topicId === 'general' ? null : this.topicId;

    if (this.activityType === 'test') {
      const payload = JSON.parse(JSON.stringify(this.testData));
      payload.topicId = finalTopicId;

      if (payload.questions) {
        payload.questions.forEach((q: any) => {
          switch (Number(q.level)) {
            case 1: q.level = 'knowing'; break;
            case 2: q.level = 'understanding'; break;
            case 3: q.level = 'applying'; break;
            case 4: q.level = 'analyzing'; break;
            case 5: q.level = 'creating'; break;
            case 6: q.level = 'evaluating'; break;
            default: q.level = 'knowing';
          }

          if ((q.type === 'OpenAnswer' || q.type === 'openAnswer') &&
            (q.checkingType === 'Manual' || q.checkingType === 'manual')) {
            q.options = [];
          }

          switch (q.type) {
            case 'SingleChoice': q.type = 'singleChoice'; break;
            case 'MultipleChoice': q.type = 'multipleChoice'; break;
            case 'OpenAnswer': q.type = 'openAnswer'; break;
          }

          if (q.checkingType) {
            q.checkingType = q.checkingType.toLowerCase();
          } else if (q.isAutoEvaluated !== undefined) {
            q.checkingType = q.isAutoEvaluated ? 'automatic' : 'manual';
            delete q.isAutoEvaluated;
          }
        });
      }

      let h = this.durationHours || 0;
      let m = this.durationMinutes || 0;
      let s = this.durationSeconds || 0;

      if (s > 59) {
        m += Math.floor(s / 60);
        s = s % 60;
      }
      if (m > 59) {
        h += Math.floor(m / 60);
        m = m % 60;
      }

      const padH = h.toString().padStart(2, '0');
      const padM = m.toString().padStart(2, '0');
      const padS = s.toString().padStart(2, '0');
      payload.duration = `${padH}:${padM}:${padS}`;

      this.activityService.addExam(this.courseId, payload).subscribe({
        next: async (res) => {
          console.log('Тест успішно створено!', res);
          await this.router.navigate(['/course-details', this.courseId]);
        },
        error: (err) => {
          console.error('Помилка при створенні тесту', err, payload);
        }
      });

    } else if (this.activityType === 'lecture') {

      (this.lectureData as any).topicId = finalTopicId;

      this.activityService.addLecture(this.courseId, this.lectureData).subscribe({
        next: async (createdLecture) => {
          console.log('Лекцію успішно створено!', createdLecture);
          await this.router.navigate(['/course-details', this.courseId]);
        },
        error: (err) => {
          console.error('Error during lecture creation:', err);
        }
      });
    }
  }

  removeQuestion(questionIndex: number) {
    if (this.testData.questions) {
      this.testData.questions.splice(questionIndex, 1);
    }
  }

  removeOption(questionIndex: number, optionIndex: number) {
    if (!this.testData.questions) {
      return;
    }

    const question = this.testData.questions[questionIndex];

    if (question.options) {
      question.options.splice(optionIndex, 1);
    }
  }

  onLevelManuallyChanged(index: number, newValue: number) {
    if (!this.testData.questions) return;

    let val = newValue;
    if (val > 6) val = 6;
    if (val < 1) val = 1;

    this.testData.questions[index].level = val as any;

    // Якщо до цього тут успішно попрацював ШІ, помічаємо, що людина втрутилася
    if (this.aiSuccessStatus[index]) {
      this.isLevelManuallyOverridden[index] = true;
    }
  }
}
