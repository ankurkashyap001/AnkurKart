import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ModalType = 'success' | 'error' | 'confirm' | 'info';

export interface ModalData {
  type: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class Modal {
  private modalStateSubject = new BehaviorSubject<ModalData | null>(null);
  modalState$ = this.modalStateSubject.asObservable();

  // Show generic/custom modal
  show(data: ModalData) {
    this.modalStateSubject.next(data);
  }

  // Quick Helper for Success
  // Helper for Success with optional callback
  showSuccess(title: string, message: string, onConfirm?: () => void) {
    this.show({
      type: 'success',
      title,
      message,
      confirmText: 'OK',
      onConfirm: onConfirm
    });
  }

  // Quick Helper for Error/Failure
  showError(title: string, message: string, onConfirm?: () => void) {
    this.show({
      type: 'error',
      title,
      message,
      confirmText: 'Dismiss',
      onConfirm: onConfirm
    });
  }

  // Quick Helper for Confirmation
  showConfirm(
    title: string, 
    message: string, 
    onConfirm: () => void, 
    confirmText: string = 'Yes, Proceed',
    cancelText: string = 'Cancel'
  ) {
    this.show({
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      onConfirm
    });
  }

  // Close Modal
  close() {
    this.modalStateSubject.next(null);
  }
}