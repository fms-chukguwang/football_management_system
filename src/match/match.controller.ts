import { Body, Controller, Post, UseGuards, Request, HttpStatus, Put, Param, Get, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MatchService } from './match.service';
import { createMatchDto } from './dtos/create-match.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { updateMatchDto } from './dtos/update-match.dto';
import { deleteMatchDto } from './dtos/delete-match.dto';
import { deleteRequestDto } from './dtos/delete-request.dto';
import { createRequestDto } from './dtos/create-request.dto';
import { updateRequestDto } from './dtos/update-request.dto';
import { createMatchResultDto } from './dtos/result-match.dto';
import { createPlayerStatsDto } from './dtos/player-stats.dto';

@ApiTags('예약')
@Controller('match')
export class MatchController {
    constructor(
        private readonly matchService: MatchService
        
        ) {}

    /**
     * 예약 생성 요청
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('/book')
    async requestCreMatch(@Request() req,@Body() createrequestDto: createRequestDto) {
        const userId = req.user.id;
    
        await this.matchService.requestCreMatch(userId,createrequestDto);
    
        return {
            statusCode: HttpStatus.OK,
            success: true,
        };
    }

    /**
     * 경기 예약
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @Post('/book/accept')
    async createMatch(@Body() creatematchDto: createMatchDto) {
    
        const data = await this.matchService.createMatch(creatematchDto);
    
        return "경기 예약 되었습니다.";
    }

    /**
     * 구단주 검증
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('/creator')
    async verifyTeamCreator(@Request() req) {
        const userId = req.user.id;

        console.log(`userId: ${userId}`);

        const data = await this.matchService.verifyTeamCreator(userId);
    
        return {
            statusCode: HttpStatus.OK,
            success: true,
            data
        };
    }

    /**
     * 경기장 조회
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('/field')
    async findAllSoccerField() {

        const data = await this.matchService.findAllSoccerField();
    
        return {
            statusCode: HttpStatus.OK,
            success: true,
            data
        };
    }

    /**
     * 예약 수정 요청
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Put(':matchId')
    async requestUptMatch(@Request() req, @Param('matchId') matchId: number, @Body() updaterequestDto: updateRequestDto) {
        const userId = req.user.id;
    
        await this.matchService.requestUptMatch(userId,matchId,updaterequestDto);
    
        return {
            statusCode: HttpStatus.OK,
            success: true,
        };
    }

    /**
     * 예약 수정
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @Post(':matchId/update')
    async updateMatch(@Param('matchId') matchId: number,@Body() updatematchDto: updateMatchDto) {
    
        await this.matchService.updateMatch(matchId,updatematchDto);
    
        return "경기 일정 수정 되었습니다.";
    }

    /**
     * 예약 삭제 요청
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Delete(':matchId')
    async requestDelMatch(@Request() req, @Param('matchId') matchId: number,@Body() deleterequestDto:deleteRequestDto) {
        const userId = req.user.id;
    
        await this.matchService.requestDelMatch(userId,matchId,deleterequestDto);
    
        return {
            statusCode: HttpStatus.OK,
            success: true,
        };
    }

    /**
     * 예약 삭제
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @Post(':matchId/delete')
    async deleteMatch(@Param('matchId') matchId: number, @Body() deletematchDto: deleteMatchDto) {
    
        await this.matchService.deleteMatch(deletematchDto,matchId);
    
        return "경기 일정 삭제 되었습니다.";
    }

    /**
     * 경기 결과 등록 (팀)
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post(':matchId/result')
    async resultMatchCreate(@Request() req, @Param('matchId') matchId: number, @Body() creatematchResultDto: createMatchResultDto) {
        const userId = req.user.id;

        await this.matchService.resultMatchCreate(userId,matchId,creatematchResultDto);
    
        return {
            statusCode: HttpStatus.OK,
            success: true
        };
    }

    /**
     * 경기 후 선수 기록 등록
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post(':matchId/result/:memberId')
    async resultPlayerCreate(@Request() req, @Param('matchId') matchId: number,@Param('memberId') memberId: number, @Body() createplayerStatsDto: createPlayerStatsDto) {
        const userId = req.user.id;

        await this.matchService.resultPlayerCreate(userId,matchId,memberId,createplayerStatsDto);
    
        return {
            statusCode: HttpStatus.OK,
            success: true
        };
    }

    /**
     * 팀 경기 일정 조회
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('team/:teamId')
    async findTeamMatches(@Param('teamId') teamId: number) {

        const data = await this.matchService.findTeamMatches(teamId);
    
        return {
            statusCode: HttpStatus.OK,
            success: true,
            data
        };
    }

    /**
     * 구단주 전체 명단 조회
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('owners')
    async getTeamOwners(@Request() req) {
        const userId = req.user.id;

        const data = await this.matchService.getTeamOwners(userId);
    
        return {
            statusCode: HttpStatus.OK,
            success: true,
            data
        };
    }

    /**
     * 예약 가능 시간 조회
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('timeslots/:selectDate/:locationId')
    async findAvailableTimes(@Param('selectDate') selectDate: string,@Param('locationId') locationId: number) {

        const data = await this.matchService.findAvailableTimes(selectDate,locationId);
    
        return {
            statusCode: HttpStatus.OK,
            success: true,
            data
        };
    }

    /**
     * 특정 경기 세부 조회
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get(':matchId')
    async findMatchDetail(@Param('matchId') matchId: number) {

        const data = await this.matchService.findMatchDetail(matchId);
    
        return {
            statusCode: HttpStatus.OK,
            success: true,
            data
        };
    }
}
