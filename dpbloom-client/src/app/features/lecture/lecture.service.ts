import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { LectureService as LectureApiService } from '../../core/api'; // твій згенерований клієнт
import { LectureDetailsDto } from '../../core/api/';

@Injectable({ providedIn: 'root' })
export class LectureService {
  private lectureApi = inject(LectureApiService);

  getLecturePageData(id: string): Observable<LectureDetailsDto> {
    return this.lectureApi.apiLectureIdGet(id);
  }
}
