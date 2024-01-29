import { Controller, Get, Param } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) {}

    @Get()
    async getTeamStats(@Param('teamId') teamId: number) {
        return await this.statisticsService.getTeamStats(1);
    }
}
