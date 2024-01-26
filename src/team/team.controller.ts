import {
    Body,
    Controller,
    Get,
    HttpStatus,
    NotFoundException,
    Param,
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
    async getTeamDetail(@Param('teamId') teamId: number) {
        const [data, count] = await this.memberService.getMemberCountByTeamId(teamId);
        const team = await this.teamService.getTeamDetail(teamId);
        return {
            team,
            totalMember: count,
        };
    }

    /**
     * 팀 전체조회
     * @param req
     */
    //@Get()
    // async getEveryTeams() {
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
        return  await this.teamService.getTeam(dto, dto.name);
    }

    @UseGuards(JwtAuthGuard, IsStaffGuard)
    @UseInterceptors(FileInterceptor('file'))
    @Patch(':teamId')
    async updateTeam(
        @Body() updateTeamDto: UpdateTeamDto,
        @Param('teamId') teamId: number,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        await this.teamService.updateTeam(teamId, updateTeamDto, file);
    }
}
