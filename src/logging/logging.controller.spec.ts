import { Test, TestingModule } from '@nestjs/testing';
import { LoggingController } from './logging.controller';
import { LoggingService } from './logging.service';
import { Model } from 'mongoose';
import { LoggingDocument } from './entities/logging.entity';

describe('LoggingController', () => {
    let controller: LoggingController;
    let myLogger: LoggingService;
    let model: Model<LoggingDocument>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [LoggingController],
            providers: [
                LoggingService,
                {
                    provide: 'LoggingModel',
                    useValue: {
                        create: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<LoggingController>(LoggingController);
        myLogger = module.get<LoggingService>(LoggingService);
    });

    it('logging 테스트', async () => {
        jest.spyOn(myLogger, 'error').mockResolvedValue();
        jest.spyOn(myLogger, 'log').mockResolvedValue();
        jest.spyOn(myLogger, 'warn').mockResolvedValue();
        jest.spyOn(myLogger, 'debug').mockResolvedValue();

        await controller.loggingTest();

        expect(myLogger.error).toHaveBeenCalledWith('this is error테스트입니다 01.18');
        expect(myLogger.log).toHaveBeenCalledWith('this is log테스트입니다 01.18');
        expect(myLogger.warn).toHaveBeenCalledWith('this is warn테스트입니다 01.18');
        expect(myLogger.debug).toHaveBeenCalledWith('this is debug테스트입니다 01.18');
    });
});
