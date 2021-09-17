import { BehaviorSubject, throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthData } from './auth-data.model';
import { User } from './user.model';
import { MessageData } from './message.model';
import { catchError, exhaustMap, take, tap } from 'rxjs/operators';

export interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user: BehaviorSubject<User> = new BehaviorSubject({} as User);

  private tokenExpirationTimer: any;
  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    console.log(this.user);
    return this.http
      .post<AuthResponseData>(
        'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDV-XwzSBk7Cf9T5VN7eCg3-XfyWj2VJc8',
        {
          email: email,
          password: password,
          returnSecureToken: true,
        }
      )

      .pipe(
        catchError(this.handleError),
        tap((resData) => {
          this.handleAuthentication(
            resData.email,
            resData.localId,
            resData.idToken,
            +resData.expiresIn
          );
        })
      );
  }

  signup(email: string, password: string) {
    return this.http
      .post<AuthResponseData>(
        'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key= AIzaSyDV-XwzSBk7Cf9T5VN7eCg3-XfyWj2VJc8',
        {
          email: email,
          password: password,
          returnSecureToken: true,
        }
      )
      .pipe(
        tap((resData) => {
          this.handleAuthentication(
            resData.email,
            resData.localId,
            resData.idToken,
            +resData.expiresIn
          );
        })
      );
  }
  logout() {
    this.user.next({} as User);
    this.router.navigate(['/login']);
    localStorage.removeItem('userData');
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    this.tokenExpirationTimer = null;
  }
  getUser() {
    return { ...this.user };
  }

  isAuth() {
    return this.user != null;
  }

  sendMessage(messageData: MessageData) {
    return this.http.post(
      'https://ecommerce-11e70-default-rtdb.firebaseio.com/posts.json',

      messageData
    );
  }
  getMessage() {
    return this.user.pipe(
      take(1),
      exhaustMap((user) => {
        return this.http.get<MessageData[]>(
          'https://ecommerce-11e70-default-rtdb.firebaseio.com/posts.json',
          {
            params: new HttpParams().set('auth', user.token),
          }
        );
      })
    );
  }

  autoLogout(expires: number) {
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expires);
  }

  private handleAuthentication(
    email: string,
    userId: string,
    token: string,
    expiresIn: number
  ) {
    const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
    const user = new User(email, userId, token, expirationDate);
    this.user.next(user);
    this.autoLogout(expiresIn * 1000);
    localStorage.setItem('userData', JSON.stringify(user));
  }

  private handleError(errorRes: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (!errorRes.error || !errorRes.error.error) {
      return throwError(errorMessage);
    }
    switch (errorRes.error.error.message) {
      case 'EMAIL_EXISTS':
        errorMessage = 'This email exists already';
        break;
      case 'EMAIL_NOT_FOUND':
        errorMessage = 'This email does not exist.';
        break;
      case 'INVALID_PASSWORD':
        errorMessage = 'This password is not correct.';
        break;
    }
    return throwError(errorMessage);
  }
}
