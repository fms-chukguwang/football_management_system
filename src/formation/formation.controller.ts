import { Controller, Get, UseGuards, Request, HttpStatus, Param } from '@nestjs/common';
import { FormationService } from './formation.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('formation')
export class FormationController {

    constructor(
        private readonly formationService: FormationService
    ) {}

    /**
     * 개인 멤버정보 조회
     * @param req
     * @returns
     */
        @ApiBearerAuth()
        @UseGuards(JwtAuthGuard)
        @Get('formation/:teamId')
        async getMatchFormation(@Param('teamId') teamId: number) {
    
            const data = await this.formationService.getMatchFormation(teamId);
        
            return {
                statusCode: HttpStatus.OK,
                success: true,
                data
            };
        }
}
