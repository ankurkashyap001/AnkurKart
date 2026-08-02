import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Modal, ModalData } from '../../services/modal';

@Component({
  selector: 'app-global-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-modal.html',
  styleUrl: './global-modal.css'
})
export class GlobalModal {
  modalData: ModalData | null = null;

  constructor(public modalService: Modal) {
    this.modalService.modalState$.subscribe((data) => {
      this.modalData = data;
    });
  }

  onConfirm() {
    if (this.modalData?.onConfirm) {
      this.modalData.onConfirm();
    }
    this.close();
  }

  onCancel() {
    if (this.modalData?.onCancel) {
      this.modalData.onCancel();
    }
    this.close();
  }

  close() {
    this.modalService.close();
  }
}