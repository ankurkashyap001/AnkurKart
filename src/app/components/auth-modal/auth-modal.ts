import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.css'
})
export class AuthModal {
  authService = inject(Auth);
  fb = inject(FormBuilder);

  // Auth Steps: 1 = Phone Number, 2 = Verify OTP
  step = signal<number>(1);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  debugOtp = signal<string | null>(null);

  phoneForm: FormGroup = this.fb.group({
    phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]]
  });

  otpForm: FormGroup = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern('^[0-9]{4}$')]],
    name: [''] // Optional name for new user
  });

  onSendOtp() {
    if (this.phoneForm.invalid) {
      this.phoneForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const phone = this.phoneForm.value.phone;

    this.authService.sendOtp(phone).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.step.set(2);
        // Dev debug mode OTP display
        if (res.otp) {
          this.debugOtp.set(res.otp);
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to send OTP.');
      }
    });
  }

  onVerifyOtp() {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload = {
      phone: this.phoneForm.value.phone,
      otp: this.otpForm.value.otp,
      name: this.otpForm.value.name
    };

    this.authService.verifyOtp(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.resetModal();
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid OTP. Try 1234.');
      }
    });
  }

  backToPhoneStep() {
    this.step.set(1);
    this.errorMessage.set(null);
    this.otpForm.reset();
  }

  resetModal() {
    this.step.set(1);
    this.phoneForm.reset();
    this.otpForm.reset();
    this.errorMessage.set(null);
    this.debugOtp.set(null);
  }
}