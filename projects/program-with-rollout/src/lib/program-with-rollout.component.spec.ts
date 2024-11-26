import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramWithRolloutComponent } from './program-with-rollout.component';

describe('ProgramWithRolloutComponent', () => {
  let component: ProgramWithRolloutComponent;
  let fixture: ComponentFixture<ProgramWithRolloutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramWithRolloutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProgramWithRolloutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
