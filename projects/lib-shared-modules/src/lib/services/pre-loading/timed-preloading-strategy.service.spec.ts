import { TestBed } from '@angular/core/testing';

import { TimedPreloadingStrategyService } from './timed-preloading-strategy.service';

describe('TimedPreloadingStrategyService', () => {
  let service: TimedPreloadingStrategyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimedPreloadingStrategyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
