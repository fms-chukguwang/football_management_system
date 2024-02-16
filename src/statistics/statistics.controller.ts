import {
    Controller,
    Get,
    InternalServerErrorException,
    Param,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { IsMemberGuard } from '../member/guard/is-member.guard';
import { StatisticsTestService } from './statistics.service.test';

@ApiTags('통계')
@Controller()
export class StatisticsController {
    constructor(
        private readonly statisticsService: StatisticsService,
        private readonly statsTestService: StatisticsTestService,
    ) {}

    /**
     * 팀 승무패 가져오기
     * @param teamId
     * @returns
     */
    @Get('statistics/:teamId')
    getTeamStats(@Param('teamId') teamId: number) {
        //return this.statisticsService.getTeamStats(teamId);
        return this.statsTestService.getTeamStats(teamId);
    }

    /**
     * TOP 플레이어 가져오기
     * @param teamId
     * @returns
     */
    @Get('statistics/:teamId/top-player')
    async getTopPlayer(@Param('teamId') teamId: number) {
        try {
            //const topPlayers = await this.statisticsService.getTopPlayer(teamId);
            const topPlayers = await this.statsTestService.getTopPlayer(teamId);

            return topPlayers;
        } catch (err) {
            throw new InternalServerErrorException();
        }
    }

    /**
     * 팀에서 회원 목록 가져오기
     * @param teamId
     * @returns
     */
    @Get('team/:teamId/players')
    getPlayers(@Param('teamId') teamId: number) {
        try {
            //return this.statisticsService.getPlayers(teamId);
            return this.statsTestService.getPlayers(teamId);
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
    getMemberStats(@Param('memberId') memberId: number) {
        return this.statisticsService.getMemberStats(memberId);
    }

    /**
     * 해당팀 카드 통계 가져오기
     * @param teamId
     * @returns
     */
    @Get('team/:teamId/cards')
    getYellowAndRedCards(@Param('teamId') teamId: number) {
        //return this.statisticsService.getYellowAndRedCards(teamId);
        return this.statsTestService.getYellowAndRedCards(teamId);
    }

    /**
     * 멤버 히스토리 가져오기
     * @param req
     * @returns
     */
    @UseGuards(IsMemberGuard)
    @Get('team/:teamId/member/:memberId/history')
    async getMemberHistory(@Req() req: Request) {
        return await this.statisticsService.getMemberHistory(req['member'].user.id);
    }

    /**
     * 멤버 개인 경기기록 가져오기
     * @param memberId
     * @returns
     */
    @Get('team/:teamId/member/:memberId/record')
    async getMemberMatchRecord(@Param('memberId') memberId: number) {
        return await this.statisticsService.getMembetMatchRecord(memberId);
    }
}
