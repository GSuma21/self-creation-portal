import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseResourceComponent } from './choose-resource.component';

describe('ChooseResourceComponent', () => {
  let component: ChooseResourceComponent;
  let fixture: ComponentFixture<ChooseResourceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChooseResourceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChooseResourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
