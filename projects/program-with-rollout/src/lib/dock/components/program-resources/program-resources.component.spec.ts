import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramResourcesComponent } from './program-resources.component';

describe('ProgramResourcesComponent', () => {
  let component: ProgramResourcesComponent;
  let fixture: ComponentFixture<ProgramResourcesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramResourcesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProgramResourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
