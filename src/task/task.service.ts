import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class TaskService {
    constructor(
        private readonly jobService: JobsService,
    ) {}
    @Cron('0 */12 * * *') // 12시간마다 실행되는 크론 작업
    //@Cron('1 * * * * *') // 1분마다 실행되는 크론 작업
    handleCron() {
        this.jobService.fetchDataAndProcess();
    }
}
