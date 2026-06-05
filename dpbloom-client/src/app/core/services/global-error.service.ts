import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorService {
  private errorSubject = new Subject<string[]>();

  errors$ = this.errorSubject.asObservable();

  showErrors(messages: string[]) {
    this.errorSubject.next(messages);
  }

  clearErrors() {
    this.errorSubject.next([]);
  }
}
