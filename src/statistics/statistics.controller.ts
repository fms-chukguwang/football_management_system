import { Controller, Get, InternalServerErrorException, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';

@ApiTags('통계')
@Controller()
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) {}

    /**
     * 팀 승무패 가져오기
     * @param teamId
     * @returns
     */
    @Get('statistics/:teamId')
    async getTeamStats(@Param('teamId') teamId: number) {
        return await this.statisticsService.getTeamStats(teamId);
    }

    /**
     * TOP 플레이어 가져오기
     * @param teamId
     * @returns
     */
    @Get('statistics/:teamId/top-player')
    async getTopPlayer(@Param('teamId') teamId: number) {
        try {
            return await this.statisticsService.getTopPlayer(teamId);
        } catch (err) {
            throw new InternalServerErrorException();
        }
    }

    @Get('team/:teamId/players')
    async getPlayers(@Param('teamId') teamId: number) {
        try {
            return await this.statisticsService.getPlayers(teamId);
        } catch (err) {
            throw new InternalServerErrorException();
        }
    }
    /**
     * 개인 통계 가져오기
     * @param memberId
     * @returns
     */
    @Get('/:memberId')
    async getMemberStats(@Param('memberId') memberId: number) {
        return await this.statisticsService.getMemberStats(memberId);
    }

    @Get('team/:teamId/cards')
    async getYellowAndRedCards(@Param('teamId') teamId: number) {
        return await this.statisticsService.getYellowAndRedCards(teamId);
    }
}
