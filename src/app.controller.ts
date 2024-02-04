import { BadRequestException, Controller, Get, Inject, Injectable } from '@nestjs/common';
import { AppService } from './app.service';
import { LoggingService } from './logging/logging.service';

@Controller()
export class AppController {
    constructor(
        private readonly appService: AppService,
        private readonly loggingService: LoggingService,
    ) {}

    @Get()
    async getHello(): Promise<string> {
        return await this.appService.getHello();
    }
    @Get('/test')
    async test() {
        throw new Error('test');
    }

    @Get('/test2')
    async test2() {
        await this.loggingService.warn('테스트2가 경고를 발생시켰습니다.');
        throw new BadRequestException('BadRequestException');
    }
}
