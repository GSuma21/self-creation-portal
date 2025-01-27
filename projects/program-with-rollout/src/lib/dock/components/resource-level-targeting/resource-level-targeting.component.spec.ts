import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceLevelTargetingComponent } from './resource-level-targeting.component';

describe('ResourceLevelTargetingComponent', () => {
  let component: ResourceLevelTargetingComponent;
  let fixture: ComponentFixture<ResourceLevelTargetingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceLevelTargetingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResourceLevelTargetingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
