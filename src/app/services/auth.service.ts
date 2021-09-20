import { BehaviorSubject, throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Router } from '@angular/router';

import { User } from './user.model';
import { MessageData } from './message.model';
import { catchError, exhaustMap, map, take, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

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
  user: BehaviorSubject<User>;

  private tokenExpirationTimer: any;
  private API_URL = environment.API_URL;
  constructor(private http: HttpClient, private router: Router) {
    this.user = new BehaviorSubject<User>(
      JSON.parse(localStorage.getItem('currentUser')!)
    );
  }

  public get currentUserValue(): User {
    return this.user.value;
  }

  private authdata: string;

  login(email: string, password: string) {
    return this.http
      .post<any>(this.API_URL + '/user/login/', {
        email: email,
        password: password,
      })

      .pipe(
        map((resData) => {
          this.authdata = window.btoa(email + ':' + password);
          localStorage.setItem('currentUser', JSON.stringify(this.authdata));
          this.user.next(resData);
          return resData;
        })
      );
  }

  signup(email: string, password: string, name: string) {
    return this.http
      .post<AuthResponseData>(this.API_URL + '/user/signup', {
        email: email,
        password: password,
        name: name,
      })
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
    // remove user from local storage to log user out
    localStorage.removeItem('currentUser');
    this.user.next(null!);
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
