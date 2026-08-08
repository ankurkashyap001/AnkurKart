import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AddressService } from '../../services/address.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  addressService = inject(AddressService);
  private fb = inject(FormBuilder);

  activeTab = signal<'personal' | 'addresses'>('personal');
  isEditing = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  
  showAddAddressModal = signal<boolean>(false);
  deletingAddressId = signal<number | null>(null);

  userProfile = signal<{ name: string; email: string; phone: string }>({
    name: 'Ankur Kashyap',
    email: 'ankur@example.com',
    phone: '6396958896'
  });

  profileForm!: FormGroup;
  addressForm!: FormGroup;

  ngOnInit() {
    // Load User from Local Storage if present
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        this.userProfile.set({
          name: parsed.name || parsed.full_name || 'Ankur Kashyap',
          email: parsed.email || 'ankur@example.com',
          phone: parsed.phone || '6396958896'
        });
      } catch (e) {}
    }

    this.profileForm = this.fb.group({
      name: [this.userProfile().name, Validators.required],
      phone: [this.userProfile().phone, [Validators.required, Validators.pattern('^[0-9]{10}$')]]
    });

    this.addressForm = this.fb.group({
      full_name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      address_line: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postal_code: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });

    this.addressService.loadAddresses();
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    this.isSaving.set(true);

    setTimeout(() => {
      const updated = {
        ...this.userProfile(),
        name: this.profileForm.value.name,
        phone: this.profileForm.value.phone
      };
      this.userProfile.set(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      this.isSaving.set(false);
      this.isEditing.set(false);
    }, 600);
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