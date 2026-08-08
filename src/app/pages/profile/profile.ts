import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AddressService } from '../../services/address.service';
import { Auth } from '../../services/auth';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  addressService = inject(AddressService);
  // HTML template access ke liye Auth service ko public rakhein
  public authService = inject(Auth);
  private fb = inject(FormBuilder);

  activeTab = signal<'personal' | 'addresses'>('personal');
  isEditing = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isLoadingProfile = signal<boolean>(false);
  
  showAddAddressModal = signal<boolean>(false);
  deletingAddressId = signal<number | null>(null);

  // Initialized empty signal instead of hardcoding
  userProfile = signal<{ name: string; email: string; phone: string }>({
    name: '',
    email: '',
    phone: ''
  });

  profileForm!: FormGroup;
  addressForm!: FormGroup;

  ngOnInit() {
    this.initForms();
    this.loadUserProfile();
    this.addressService.loadAddresses();
  }

  private initForms() {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.pattern('^[0-9]{10}$')]]
    });

    this.addressForm = this.fb.group({
      full_name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      address_line: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postal_code: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });
  }

  loadUserProfile() {
    // 1. Pehle Auth Service / LocalStorage Signal se populate karo
    const currentUser = this.authService.currentUser() || this.authService.getUserFromStorage();

    if (currentUser) {
      this.populateUserData(currentUser);
    }
  }

  private populateUserData(user: any) {
    const data = {
      name: user.name || user.full_name || '',
      email: user.email || '',
      phone: user.phone || ''
    };

    this.userProfile.set(data);

    this.profileForm.patchValue({
      name: data.name,
      phone: data.phone
    });
  }

  // Real Backend API Hit for Updating Profile
  saveProfile() {
    if (this.profileForm.invalid) return;
    this.isSaving.set(true);

    const payload = {
      name: this.profileForm.value.name,
      phone: this.profileForm.value.phone
    };

    this.authService.updateProfile(payload).subscribe({
      next: (res: any) => {
        const updatedUser = res?.data || res?.user || res;
        
        // Signal & Form Sync
        this.populateUserData(updatedUser);
        
        this.isSaving.set(false);
        this.isEditing.set(false);
      },
      error: (err: any) => {
        console.error('Failed to update profile:', err);
        alert(err.error?.message || 'Failed to update profile.');
        this.isSaving.set(false);
      }
    });
  }

  onSaveAddress() {
    if (this.addressForm.invalid) return;
    this.addressService.addAddress(this.addressForm.value).subscribe({
      next: () => {
        this.addressForm.reset();
        this.showAddAddressModal.set(false);
      }
    });
  }

  confirmDeleteAddress(id: number) {
    this.deletingAddressId.set(id);
  }

  executeDeleteAddress() {
    const id = this.deletingAddressId();
    if (!id) return;

    this.addressService.deleteAddress(id).subscribe({
      next: () => this.deletingAddressId.set(null),
      error: () => this.deletingAddressId.set(null)
    });
  }
}