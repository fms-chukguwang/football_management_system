import { Controller, Get, UseGuards, Request, HttpStatus, Param, Post, Body } from '@nestjs/common';
import { FormationService } from './formation.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateFormationDto } from './dtos/update-formation.dto';

@ApiTags('전술')
@Controller('formation')
export class FormationController {

    constructor(
        private readonly formationService: FormationService
    ) {}

    /**
     * 팀별 포메이션 조회
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get(':teamId/:matchId')
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
