import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChoosingResourceComponent } from './choosing-resource.component';

describe('ChoosingResourceComponent', () => {
  let component: ChoosingResourceComponent;
  let fixture: ComponentFixture<ChoosingResourceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChoosingResourceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChoosingResourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
