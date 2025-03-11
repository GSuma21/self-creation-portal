import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardDialogPopupComponent } from './card-dialog-popup.component';

describe('CardDialogPopupComponent', () => {
  let component: CardDialogPopupComponent;
  let fixture: ComponentFixture<CardDialogPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardDialogPopupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardDialogPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
