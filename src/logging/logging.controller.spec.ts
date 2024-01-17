import { Test, TestingModule } from '@nestjs/testing';
import { LoggingController } from './logging.controller';
import { LoggingService } from './logging.service';

describe('LoggingController', () => {
  let controller: LoggingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoggingController],
      providers: [LoggingService],
    }).compile();

    controller = module.get<LoggingController>(LoggingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
