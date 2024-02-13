import { Controller, Get, UseGuards, Request, HttpStatus, Param, Post, Body } from '@nestjs/common';
import { FormationService } from './formation.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateFormationDto } from './dtos/update-formation.dto';
import { DataSource } from 'typeorm';

@ApiTags('전술')
@Controller('formation')
export class FormationController {

    constructor(
        private readonly formationService: FormationService,
        private readonly dataSource: DataSource
    ) {}


    /**
     * 인기 포메이션 조회
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('popular')
    async getPopularFormation() {

        const data = await this.formationService.getPopularFormation();
    
        return data;
    }

    /**
     * 최적 포메이션 추천
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('best/:homeTeamId/:opponent_team_id')
    async getBestFormation(@Param('homeTeamId') homeTeamId: number,@Param('opponent_team_id') opponent_team_id: number) {

        const data = await this.formationService.getBestFormation(homeTeamId,opponent_team_id);
    
        return data;
    }

    /**
     * 최근 3경기간 최다 누적 경고자 조회
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('warning/:teamId')
    async getWarningmember(@Param('teamId') teamId: number) {

        const data = await this.formationService.getWarningmember(teamId);
    
        return data;
    }

    /**
     * 팀별 포메이션 조회
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get(':teamId/match/:matchId/')
    async getMatchFormation(@Param('teamId') teamId: number,@Param('matchId') matchId: number) {

        const data = await this.formationService.getMatchFormation(teamId,matchId);
    
        return {
            statusCode: HttpStatus.OK,
            success: true,
            data
        };
    }

    /**
     * 팀별 포메이션 저장
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post(':teamId/:matchId')
    async saveMatchFormation(@Param('teamId') teamId: number,@Param('matchId') matchId: number,@Body() updateFormationDto:UpdateFormationDto) {

        const data = await this.formationService.saveMatchFormation(teamId,matchId,updateFormationDto);
    
        return {
            statusCode: HttpStatus.OK,
            success: true,
            data
        };
    }
}
