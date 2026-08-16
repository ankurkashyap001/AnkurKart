import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCategoriesForm } from './admin-categories-form';

describe('AdminCategoriesForm', () => {
  let component: AdminCategoriesForm;
  let fixture: ComponentFixture<AdminCategoriesForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCategoriesForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCategoriesForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
