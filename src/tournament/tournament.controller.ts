import { Body, Controller, HttpStatus, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { TournamentService } from './tournament.service';
import { CreateTournamentDto } from './dtos/create-tournament.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { IsStaffGuard } from 'src/member/guard/is-staff.guard';
import { IsAdminGuard } from 'src/admin/guards/isAdmin.guard';
import { UpdateTournamentDto } from './dtos/update-tournament.dto';

@Controller('tournament')
export class TournamentController {
    constructor(private readonly tournamentService: TournamentService) {}

    /**
     * 토너먼트 생성하기
     * @param createTournamentDto
     * @returns
     * @description 어드민만 생성 가능
     */
    @Post()
    // @UseGuards(JwtAuthGuard, IsAdminGuard)
    createTournament(@Body() createTournamentDto: CreateTournamentDto) {
        return this.tournamentService.createTournament(createTournamentDto);
    }

    /**
     * 토너먼트 신청
     * @param tournamentId
     * @param teamId
     * @returns
     * @description 오너만 신청 가능
     * @description 여석이 없으면 토너먼트 마감
     * @description 신청 마감일 확인
     * @description 신청 가능한지 확인
     * @description 팀이 이미 신청했는지 확인
     */
    @Post(':tournamentId/:teamId')
    // @UseGuards(JwtAuthGuard, IsStaffGuard)
    async applyTournament(
        @Param('tournamentId') tournamentId: number,
        @Param('teamId') teamId: number,
    ) {
        // 오너만 신청 가능
        const data = await this.tournamentService.applyTournament(tournamentId, teamId);
        return {
            message: data,
            statusCode: HttpStatus.CREATED,
            success: true,
        };
    }

    /**
     * 토너먼트 참가 취소
     * @param tournamentId
     * @param teamId
     * @returns
     * @description 오너만 취소 가능
     */
    @Patch(':tournamentId/:teamId/cancel')
    // @UseGuards(JwtAuthGuard, IsStaffGuard)
    async cancelTournament(
        @Param('tournamentId') tournamentId: number,
        @Param('teamId') teamId: number,
    ) {
        // 오너만 취소 가능
        const data = await this.tournamentService.cancelTournament(tournamentId, teamId);
        return {
            message: data,
            statusCode: HttpStatus.OK,
            success: true,
        };
    }

    /**
     * 토너먼트 수정
     * @param tournamentId
     * @returns
     * @description 어드민만 수정 가능
     */
    @Patch(':tournamentId')
    // @UseGuards(JwtAuthGuard, IsAdminGuard)
    async updateTournament(
        @Param('tournamentId') tournamentId: number,
        @Body() updateTournamentDto: UpdateTournamentDto,
    ) {
        const data = await this.tournamentService.updateTournament(
            tournamentId,
            updateTournamentDto,
        );
        return {
            message: data,
            statusCode: HttpStatus.OK,
            success: true,
        };
    }
}
