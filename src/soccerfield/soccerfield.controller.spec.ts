import { Test, TestingModule } from '@nestjs/testing';
import { SoccerfieldController } from './soccerfield.controller';
import { SoccerfieldService } from './soccerfield.service';

describe('SoccerfieldController', () => {
  let controller: SoccerfieldController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SoccerfieldController],
      providers: [SoccerfieldService],
    }).compile();

    controller = module.get<SoccerfieldController>(SoccerfieldController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
