import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    NotFoundException,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsStaffGuard } from '../member/guard/is-staff.guard';
import { CreateTeamDto } from './dtos/create-team.dto';
import { UpdateTeamDto } from './dtos/update-team.dto';
import { TeamService } from './team.service';
import { MemberService } from '../member/member.service';
import { PaginateTeamDto } from './dtos/paginate-team-dto';

@ApiTags('팀')
@Controller('team')
export class TeamController {
    constructor(
        private readonly teamService: TeamService,
        private readonly memberService: MemberService,
    ) {}

    /**
     * 팀 생성하기
     * @param req
     */
    @ApiBearerAuth()
    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async createTeam(
        @Req() req: Request,
        @Body() createTeamDto: CreateTeamDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        const userId = req['user'].id;
        const data = await this.teamService.createTeam(createTeamDto, userId, file);

        return { status: HttpStatus.OK, success: true, data };
    }

    /**
     * 팀 상세조회
     * @param req
     */
    @Get(':teamId')
    async getTeamDetail(@Param('teamId', ParseIntPipe) teamId: number) {
        const [data, count] = await this.memberService.getMemberCountByTeamId(+teamId);

        const team = await this.teamService.getTeamDetail(+teamId);
        return {
            team,
            totalMember: count,
        };
    }

    /**
     * 팀 전체조회
     * @param req
     */

    // @Get()
    // async getEveryTeams() {
    //     console.log('전체 조회');

    //     const teams = await this.teamService.getTeams();
    //     if (!teams) {
    //         throw new NotFoundException('팀을 찾을 수 없습니다.');
    //     }
    //     return teams;
    // }

    /**
     * 팀 목록 조회
     * @param query
     * @returns
     */
    @Get('')
    async getTeam(@Query() dto: PaginateTeamDto) {
        return await this.teamService.getTeam(dto, dto.name, dto.isMixed, dto.region, dto.gender);
    }

    /**
     * 성별 따른 팀 목록 조회
     * @param req
     * @param query
     * @returns
     */
    //    @ApiBearerAuth()
    //    @UseGuards(JwtAuthGuard)
    //    @Get('/list/gender')
    //    async getTeamByGender(@Request() req, @Query() dto: PaginateTeamDto) {
    //     const userId = req.user.id;
    //     return  await this.teamService.getTeamByGender(userId, dto, dto.name);

    //    }

    /**
     * 팀 정보 수정
     * @param updateTeamDto
     * @param teamId
     * @param file
     */
    @UseGuards(JwtAuthGuard, IsStaffGuard)
    @UseInterceptors(FileInterceptor('file'))
    @Patch(':teamId')
    async updateTeam(
        @Body() updateTeamDto: UpdateTeamDto,
        @Param('teamId') teamId: number,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        try {
            await this.teamService.updateTeam(teamId, updateTeamDto, file);

            return {
                message: '업데이트가 성공하였습니다.',
                statusCode: HttpStatus.OK,
                success: true,
            };
        } catch (err) {
            return {
                message: `업데이트가 실패하였습니다. error ${err}`,
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                success: false,
            };
        }
    }

    /**
     * 팀 멤버 조회
     * @param query
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get(':teamId/member')
    async getTeamMembers(@Param('teamId') teamId: number) {
        const [data, count] = await this.memberService.getMemberCountByTeamId(teamId);
        console.log('data=', data);
        const nameToMemberId = data.map((member) => {
            return { name: member.user.name, memberId: member.id };
        });
        return {
            data: nameToMemberId,
            total: count,
        };
    }
}
