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

@ApiTags('예약')
@Controller('match')
export class MatchController {
    constructor(private readonly matchService: MatchService) {}

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
    
        return {
          statusCode: HttpStatus.CREATED,
          success: true,
          data,
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
    
        return {
          statusCode: HttpStatus.OK,
          success: true
        };
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
    
        return {
          statusCode: HttpStatus.OK,
          success: true
        };
    }
}
