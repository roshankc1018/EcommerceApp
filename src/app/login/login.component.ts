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
      const name = this.loginform.value.name;
      const email = this.loginform.value.email;
      const password = this.loginform.value.password;
      this.isLoading = true;
      this.authService.login(email, password).subscribe(
        (res) => {
          this.isLoading = false;
          this.router.navigate(['/contact']);
        },
        (errorMessage) => {
          console.log(errorMessage);
          this.error = errorMessage;
          this.isLoading = false;
        }
      );
    }

    // display form values on success
  }
}
