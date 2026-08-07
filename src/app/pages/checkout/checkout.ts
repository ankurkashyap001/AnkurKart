import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AddressService } from '../../services/address.service';
import { OrderService } from '../../services/order.service';
import { Modal } from '../../services/modal';

export type PaymentMethod = 'COD' | 'Online' | 'UPI' | 'CARD';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout implements OnInit {
  cartService = inject(CartService);
  addressService = inject(AddressService);
  orderService = inject(OrderService);
  modalService = inject(Modal);
  router = inject(Router);
  fb = inject(FormBuilder);

  selectedAddressId = signal<number | null>(null);
  paymentMethod = signal<PaymentMethod>('UPI');
  isPlacingOrder = signal<boolean>(false);
  showAddressForm = signal<boolean>(false);
  isSavingAddress = signal<boolean>(false);

  addressForm: FormGroup = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    address_line: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    postal_code: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
  });

  constructor() {
    effect(() => {
      const addresses = this.addressService.addresses();
      if (addresses && addresses.length > 0 && !this.selectedAddressId()) {
        this.selectedAddressId.set(addresses[0].id ?? null);
      }
    });
  }

  ngOnInit() {
    if (this.cartService.cart().items.length === 0) {
      this.router.navigate(['/']);
      return;
    }
    this.addressService.loadAddresses();
  }

  selectAddress(id: number) {
    this.selectedAddressId.set(id);
  }

  toggleAddressForm() {
    this.showAddressForm.update(val => !val);
  }

  onSaveAddress() {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.isSavingAddress.set(true);

    this.addressService.addAddress(this.addressForm.value).subscribe({
      next: (res: any) => {
        this.isSavingAddress.set(false);
        this.addressForm.reset();
        this.showAddressForm.set(false);
        if (res && res.id) {
          this.selectedAddressId.set(res.id);
        }
      },
      error: (err: any) => {
        this.isSavingAddress.set(false);
        const errorMsg = err.error?.message || 'Failed to save address. Please check input data.';
        this.modalService.showError('Address Error', errorMsg);
      }
    });
  }

  onPlaceOrder() {
    const addressId = this.selectedAddressId();

    if (!addressId) {
      alert('Please select a shipping address.');
      return;
    }

    if (this.cartService.cart().items.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    this.isPlacingOrder.set(true);

    const selectedMethod = this.paymentMethod();
    const backendPaymentMethod: 'COD' | 'Online' = selectedMethod === 'COD' ? 'COD' : 'Online';

    this.orderService.placeOrder({
      address_id: addressId,
      payment_method: backendPaymentMethod
    }).subscribe({
      next: (res: any) => {
        this.isPlacingOrder.set(false);
        this.cartService.clearCart();
        this.modalService.showSuccess(
          'Order Placed Successfully!',
          `Order #${res.order_number || res.id || ''} has been created.`,
          () => {
            this.router.navigate(['/']);
          }
        );
      },
      error: (err: any) => {
        this.isPlacingOrder.set(false);
        this.modalService.showError('Order Failed', err.error?.message || 'Something went wrong.');
      }
    });
  }
}