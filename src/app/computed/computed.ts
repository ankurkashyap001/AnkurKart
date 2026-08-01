import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-computed',
  imports: [],
  templateUrl: './computed.html',
  styleUrl: './computed.css',
})
export class Computed {
  count = signal(0);
  doubleCount = computed(() => this.count() * 2);
  increment() {
    this.count.set(this.count() + 1);
  }
  decrement() {
    this.count.set(this.count() - 1);
  }
  reset() {
    this.count.set(0);
  }

  tripleCount = computed(() => this.count() * 3);
}
