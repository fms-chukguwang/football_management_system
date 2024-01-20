import {
    Body,
    Controller,
    Get,
    HttpStatus,
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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { IsStaffGuard } from 'src/member/guard/is-staff.guard';
import { CreateTeamDto } from './dtos/create-team.dto';
import { UpdateTeamDto } from './dtos/update-team.dto';
import { TeamService } from './team.service';

@ApiTags('팀')
@Controller('team')
export class TeamController {
    constructor(private readonly teamService: TeamService) {}

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
     * @param teamId
     * @returns
     */
    @Get(':teamId')
    getTeamDetail(@Param('teamId') teamId: number) {
        return this.teamService.getTeamDetail(teamId);
    }

    /**
     * 팀 목록 조회
     * @param query
     * @returns
     */
    @Get('')
    getTeam(@Query() query: any) {
        return this.teamService.getTeam();
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
