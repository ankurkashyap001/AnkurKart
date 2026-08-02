import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../services/auth'; // Matched with your auth.ts file path
import { Modal } from '../../services/modal';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  registerForm: FormGroup;
  isSubmitted = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: Auth, // Injected Auth class
    private router: Router,
    private modal: Modal
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onSubmit() {
    this.isSubmitted = true;
    
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: (res: any) => {
          console.log('Registration success:', res);
  
          if (res.token) {
            this.authService.setToken(res.token);
          }
  
          // Modal open karein aur OK click par login redirect pass karein
          this.modal.showSuccess(
            'Registration Successful!', 
            'Your account has been created successfully. Please login to continue.',
            () => {
              // Yeh code tabhi chalega jab user Modal ke 'OK' button par click karega
              this.router.navigate(['/login']);
            }
          );
        },
        error: (err) => {
          console.error('Registration error:', err);
          this.errorMessage = err.error?.message || 'Registration failed!';
          
          this.modal.showError(
            'Registration Failed', 
            err.error?.message || 'Something went wrong. Please try again.'
          );
        }
      });
    }
  }
  // onSubmit() {
  //   this.authService.register(this.registerForm.value).subscribe({
  //     next: (res) => {
  //       // Show Success Modal
  //       this.modal.showSuccess(
  //         'Registration Successful!', 
  //         'Your account has been created successfully. Please login to continue.'
  //       );
  //     },
  //     error: (err) => {
  //       // Show Error Modal
  //       this.modal.showError(
  //         'Registration Failed', 
  //         err.error?.message || 'Something went wrong. Please try again.'
  //       );
  //     }
  //   });
  // }
}