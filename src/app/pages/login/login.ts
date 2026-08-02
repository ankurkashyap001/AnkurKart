import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { Modal } from '../../services/modal';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  isSubmitted = false;
  errorMessage = '';
  showPassword = false; // Toggle password state

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private modal: Modal,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.isSubmitted = true;

    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: (res: any) => {
          if (res.token) {
            this.authService.setToken(res.token);
          }

          this.modal.showSuccess(
            'Welcome Back!',
            'Login successful. Directing to home page...',
            () => {
              this.router.navigate(['/home']);
            }
          );
        },
        error: (err) => {
          console.error('Login error:', err);
          this.errorMessage = err.error?.message || 'Invalid email or password';

          this.modal.showError(
            'Login Failed',
            this.errorMessage
          );
        }
      });
    }
  }
}