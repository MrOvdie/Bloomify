import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {

      if (err.status === 400 && err.error && err.error.errors) {
        const validationErrors = err.error.errors;
        for (const key in validationErrors) {
          if (validationErrors.hasOwnProperty(key)) {
            const errorMessage = validationErrors[key].join('\n');
            toastr.error(errorMessage, 'Validation Error');
          }
        }
      }
      else if (err.status === 400 && typeof err.error === 'string') {
        toastr.error(err.error, 'Error');
      }
      else {
        toastr.error(`Something went awfully wrong: ${err.statusText}`, 'Error');
      }
``
      return throwError(() => err);
    })
  );
};
