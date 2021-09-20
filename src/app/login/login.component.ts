import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validator,
  Validators,
  MinLengthValidator,
  FormBuilder,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { AuthResponseData, AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginform: FormGroup;
  submitted = false;
  isLoading = false;
  error: string;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loginform = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get f() {
    return this.loginform.controls;
  }

  onLogin() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.loginform.valid) {
      const email = this.loginform.value.email;
      const password = this.loginform.value.password;
      this.isLoading = true;
      this.authService
        .login(email, password)

        .pipe(first())
        .subscribe(
          (res) => {
            this.router.navigate(['/home']);
          },
          (error) => {
            this.error = error.error.errorMessage;
            this.isLoading = false;
          }
        );
    }

    // display form values on success
  }
}
