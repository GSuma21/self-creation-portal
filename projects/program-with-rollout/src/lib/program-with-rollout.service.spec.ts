import { TestBed } from '@angular/core/testing';

import { ProgramWithRolloutService } from './program-with-rollout.service';

describe('ProgramWithRolloutService', () => {
  let service: ProgramWithRolloutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProgramWithRolloutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
