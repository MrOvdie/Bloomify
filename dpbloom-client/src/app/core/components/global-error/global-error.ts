import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalErrorService } from '../../services/global-error.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-global-error',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./global-error.html",
  styleUrls: ['/global-error.scss']
})
export class GlobalErrorComponent implements OnInit, OnDestroy {
  private errorService = inject(GlobalErrorService);
  private sub!: Subscription;

  errorMessages: string[] = [];

  ngOnInit() {
    this.sub = this.errorService.errors$.subscribe(messages => {
      this.errorMessages = messages;

      if (messages.length > 0) {
        setTimeout(() => this.close(), 7000);
      }
    });
  }

  close() {
    this.errorMessages = [];
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }
}
