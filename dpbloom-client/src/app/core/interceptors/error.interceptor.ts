import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      let errorTitle = 'Error';
      let errorMessage = 'Something went wrong. Please check your connection.';

      if (err.status === 400) {
        errorTitle = 'Validation Error';

        if (err.error && err.error.errors) {
          const messages = [];
          for (const key in err.error.errors) {
            if (err.error.errors.hasOwnProperty(key)) {
              messages.push(...err.error.errors[key]);
            }
          }
          errorMessage = messages.join('<br>');
        }
        else if (err.error && err.error.message) {
          errorMessage = err.error.message;
        }
        else if (err.error && err.error.error) {
          errorMessage = err.error.error;
        }
        else if (typeof err.error === 'string') {
          errorMessage = err.error;
        }
      }
      else if (err.status === 401 || err.status === 403) {
        errorTitle = err.status === 401 ? 'Unauthorized' : 'Forbidden';

        if (err.error && err.error.error) {
          errorMessage = err.error.error;
        } else if (err.error && err.error.message) {
          errorMessage = err.error.message;
        } else if (typeof err.error === 'string') {
          errorMessage = err.error;
        } else {
          errorMessage = err.status === 401
            ? 'Please log in to continue.'
            : 'You do not have permission to perform this action.';
        }
      }
      else if (err.status === 404) {
        errorTitle = 'Not Found';
        errorMessage = 'The requested resource was not found.';
      }
      else if (err.status >= 500) {
        errorTitle = 'Server Error';
        errorMessage = 'An internal server error occurred.';
      }
      toastr.error(errorMessage, errorTitle, {
        enableHtml: true,
        timeOut: 6000,
        progressBar: true
      });

      return throwError(() => err);
    })
  );
};
