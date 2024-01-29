import { Controller, Get, Param } from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) {}

    @Get()
    getTeamStats(@Param('teamId') teamId: number) {
        this.statisticsService.getTeamStats(1);
    }
}
