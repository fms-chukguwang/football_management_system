import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoggingService } from './logging.service';

@ApiTags('logging')
@Controller('logging')
export class LoggingController {
    constructor(private readonly mylogger: LoggingService) {}

    @Get()
    async loggingTest() {
        this.mylogger.error('this is error테스트입니다 01.18');
        this.mylogger.log('this is log테스트입니다 01.18');
        this.mylogger.warn('this is warn테스트입니다 01.18');
        this.mylogger.debug('this is debug테스트입니다 01.18');
        return '로깅 테스트';
    }
}
