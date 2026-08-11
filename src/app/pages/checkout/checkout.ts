import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AddressService } from '../../services/address.service';
import { OrderService } from '../../services/order.service';
import { ToastService } from '../../services/toast.service';

export type PaymentMethod = 'COD' | 'UPI';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout implements OnInit {
  public cartService = inject(CartService);
  public addressService = inject(AddressService);
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  selectedAddressId = signal<number | null>(null);
  paymentMethod = signal<PaymentMethod>('UPI');
  upiUtr = signal<string>('');
  isPlacingOrder = signal<boolean>(false);
  showAddressForm = signal<boolean>(false);
  isSavingAddress = signal<boolean>(false);

  // Success Modal State (Optional)
  showSuccessModal = signal<boolean>(false);
  createdOrderId = signal<string | number>('');

  upiVpa = '6396956896@ybl';

  // Dynamic UPI QR Code URL based on Cart Grand Total
  qrCodeUrl = computed(() => {
    const amount = this.cartService.grandTotal();
    const encodedVpa = encodeURIComponent(this.upiVpa);
    const encodedName = encodeURIComponent('AnkurKart');
    const upiData = `upi://pay?pa=${encodedVpa}&pn=${encodedName}&am=${amount}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiData)}&size=180x180`;
  });

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
      this.toastService.info('Your cart is empty');
      this.router.navigate(['/']);
      return;
    }
    this.addressService.loadAddresses();
  }

  selectAddress(id: number) {
    this.selectedAddressId.set(id);
  }

  selectPaymentMethod(method: PaymentMethod) {
    this.paymentMethod.set(method);
  }

  copyUpiVpa() {
    navigator.clipboard.writeText(this.upiVpa);
    this.toastService.success('UPI ID copied to clipboard!');
  }

  toggleAddressForm() {
    this.showAddressForm.update(val => !val);
  }

  onSaveAddress() {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      this.toastService.warning('Please complete the address form properly.');
      return;
    }

    this.isSavingAddress.set(true);

    this.addressService.addAddress(this.addressForm.value).subscribe({
      next: (res: any) => {
        this.isSavingAddress.set(false);
        this.addressForm.reset();
        this.showAddressForm.set(false);
        this.toastService.success('Address saved successfully!');
        const newId = res?.id || res?.data?.id;
        if (newId) {
          this.selectedAddressId.set(newId);
        }
      },
      error: (err: any) => {
        this.isSavingAddress.set(false);
        this.toastService.error(err.error?.message || 'Failed to save address.');
      }
    });
  }

  onPlaceOrder() {
    const addressId = this.selectedAddressId();

    if (!addressId) {
      this.toastService.warning('Please select a shipping address.');
      return;
    }

    if (this.cartService.cart().items.length === 0) {
      this.toastService.error('Your cart is empty.');
      return;
    }

    this.isPlacingOrder.set(true);

    const payload = {
      address_id: addressId,
      payment_method: this.paymentMethod(),
      transaction_id: this.paymentMethod() === 'UPI' ? (this.upiUtr() || null) : null,
      coupon_code: this.cartService.appliedCoupon()?.code || null,
      discount_amount: this.cartService.discountTotal(),
      subtotal: this.cartService.subtotal(),
      delivery_fee: this.cartService.deliveryFee(),
      grand_total: this.cartService.grandTotal()
    };

    this.orderService.placeOrder(payload).subscribe({
      next: (res: any) => {
        this.isPlacingOrder.set(false);
        
        // Clear cart and reset coupon state
        this.cartService.clearCart();
        this.cartService.removeCoupon(false);
        
        this.toastService.success('Order Placed Successfully 🎉');

        // Extract created order ID & redirect immediately to Live Order Tracking
        const orderId = res?.data?.id || res?.id || res?.order_id || res?.data?.order_number;
        if (orderId) {
          this.router.navigate(['/orders', orderId, 'track']);
        } else {
          this.router.navigate(['/my-orders']);
        }
      },
      error: (err: any) => {
        this.isPlacingOrder.set(false);
        this.toastService.error(err.error?.message || 'Order failed. Please try again.');
      }
    });
  }

  goToOrderTracking() {
    this.showSuccessModal.set(false);
    this.router.navigate(['/orders', this.createdOrderId(), 'track']);
  }

  goToHome() {
    this.showSuccessModal.set(false);
    this.router.navigate(['/']);
  }
}