import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Param,
    Post,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateTeamDto } from './dtos/create-team.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { RETURN_SUCCESS_OBJECT1 } from 'src/common/return-type/success.return-type';
import { TeamModel } from './entities/team.entity';

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

        const data = await this.teamService.createTeam(
            createTeamDto,
            userId,
            file,
        );

        return { status: HttpStatus.OK, success: true };
    }

    @Get(':teamId')
    getTeamDetail(@Param('teamId') teamId: number) {
        return this.teamService.getTeamDetail(teamId);
    }
}
