import { Body, Controller, Post, UseGuards, Request, HttpStatus, Put, Param, Get, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MatchService } from './match.service';
import { createMatchDto } from './dtos/create-match.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { updateMatchDto } from './dtos/update-match.dto';

@ApiTags('예약')
@Controller('match')
export class MatchController {
    constructor(private readonly matchService: MatchService) {}

    /**
     * 경기 예약
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('/book')
    async createMatch(@Request() req, @Body() creatematchDto: createMatchDto) {
        const userId = req.user.id;
    
        const data = await this.matchService.createMatch(userId,creatematchDto);
    
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
    async requestUptMatch(@Request() req, @Param('matchId') matchId: number, @Body() updatematchDto: updateMatchDto) {
        const userId = req.user.id;
    
        await this.matchService.requestUptMatch(userId,matchId,updatematchDto);
    
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
    @UseGuards(JwtAuthGuard)
    @Put(':matchId/accept')
    async updateMatch(@Request() req, @Param('matchId') matchId: number, @Body() updatematchDto: updateMatchDto) {
        const userId = req.user.id;
    
        await this.matchService.updateMatch(userId,matchId,updatematchDto);
    
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
    async requestDelMatch(@Request() req, @Param('matchId') matchId: number) {
        const userId = req.user.id;
    
        await this.matchService.requestDelMatch(userId,matchId);
    
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
    @UseGuards(JwtAuthGuard)
    @Delete(':matchId/accept')
    async deleteMatch(@Request() req, @Param('matchId') matchId: number) {
        const userId = req.user.id;
    
        await this.matchService.deleteMatch(userId,matchId);
    
        return {
          statusCode: HttpStatus.OK,
          success: true
        };
    }
}
