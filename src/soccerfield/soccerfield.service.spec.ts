import { Test, TestingModule } from '@nestjs/testing';
import { SoccerfieldService } from './soccerfield.service';

describe('SoccerfieldService', () => {
  let service: SoccerfieldService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SoccerfieldService],
    }).compile();

    service = module.get<SoccerfieldService>(SoccerfieldService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
