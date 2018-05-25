import { API_CONFIG } from './../config/api.config';
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpEvent, HttpRequest, HTTP_INTERCEPTORS, HttpResponse } from '@angular/common/http';
import { Observable, pipe } from 'rxjs';
import { NbAuthService } from '@nebular/auth';
import { map } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: NbAuthService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const N = API_CONFIG.apiURL.length;
    const requestToAPI = req.url.substring(0, N) === API_CONFIG.apiURL;

    return new Observable<HttpEvent<any>>(observer => {
      this.authService.isAuthenticated()
        .subscribe(isAuthenticated => {
          if (isAuthenticated && requestToAPI) {
            console.log(`Authenticated: ` + isAuthenticated);
            this.authService.getToken()
              .subscribe(token => {
                const authReq = req.clone({ headers: req.headers.set('Authorization', 'Bearer ' + token) });
                next.handle(req).subscribe(event => observer.next(event));
              });
          } else {
            next.handle(req).pipe(
              map(event => {
                if (event instanceof HttpResponse && req.url === (API_CONFIG.apiURL + '/login')) {
                  const authorization = event.headers.get('Authorization');
                  console.log(authorization);

                  if (authorization) {
                    event = event.clone({
                      body: {
                        token: authorization.substring(7),
                      }
                    });
                  }
                }

                return event;
              })
            ).subscribe(event => {
              observer.next(event);
            })
          }
        });


    });
  }
}

export const AuthInterceptorProvider = {
  provide: HTTP_INTERCEPTORS,
  useClass: AuthInterceptor,
  multi: true,
};
