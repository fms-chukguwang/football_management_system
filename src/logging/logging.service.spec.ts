import { Test, TestingModule } from '@nestjs/testing';
import { LoggingService } from './logging.service';
import { LoggingDocument } from './entities/logging.entity';
import { Model } from 'mongoose';

enum Level {
    log = '[LOG]',
    error = '[ERROR]',
    warn = '[WARN]',
    debug = '[DEBUG]',
    verbose = '[VERBOSE]',
    fatal = '[FATAL]',
}

describe('LoggingService', () => {
    let service: LoggingService;
    let model: Model<LoggingDocument>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
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

        service = module.get<LoggingService>(LoggingService);
        model = module.get<Model<LoggingDocument>>('LoggingModel');
    });

    it('성공', () => {
        expect(service).toBeDefined();
        expect(model).toBeDefined();
    });
    it('log', async () => {
        const createLog = await service.log('test');
    });
});
