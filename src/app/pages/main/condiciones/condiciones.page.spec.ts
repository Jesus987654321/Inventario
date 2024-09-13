import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CondicionesPage } from './condiciones.page';

describe('CondicionesPage', () => {
  let component: CondicionesPage;
  let fixture: ComponentFixture<CondicionesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CondicionesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
