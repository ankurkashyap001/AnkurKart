import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-counter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './counter.html',
  styleUrl: './counter.css',
})
export class Counter {
  constructor(private http: HttpClient) {}
  // private http = inject(HttpClient);
  apiData: any;
  ngOnInit() {
    this.http.get('http://127.0.0.1:8000/api/test').subscribe({
      next: (response) => {
        this.apiData = response;
        console.log('Laravel Response:', response);
      },
      error: (err) => console.error('CORS or Connection Error:', err)
    });
  }

  count = signal(0);

  increment() {
    this.count.set(this.count() + 1);
  }

  decrement() {
    this.count.set(this.count() - 1);
  }
  reset() {
    this.count.set(0);
  }
}
