import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TargetCriteriaComponent } from './target-criteria.component';

describe('TargetCriteriaComponent', () => {
  let component: TargetCriteriaComponent;
  let fixture: ComponentFixture<TargetCriteriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TargetCriteriaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TargetCriteriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
