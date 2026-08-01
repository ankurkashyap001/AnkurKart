import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Computed } from './computed';

describe('Computed', () => {
  let component: Computed;
  let fixture: ComponentFixture<Computed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Computed]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Computed);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
