import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    UseGuards,
    Request,
    HttpStatus,
    Req,
    Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MemberService } from './member.service';
import { UpdateMemberInfoDto } from './dtos/update-member-info-dto';

@ApiTags('선수')
@Controller('member')
export class MemberController {
    constructor(private readonly memberService: MemberService) {}

    /**
     * 전체 선수 정보 조회
     * @param req
     * @returns
     */
    @Get('')
    async allplayers() {
        const data = await this.memberService.findAllPlayers();

        return {
            statusCode: HttpStatus.OK,
            message: '전체 선수 조회에 성공했습니다.',
            data,
        };
    }

    /**
     * 선수 정보 조회
     * @param req
     * @returns
     */
    @Get(':teamId/:playerId')
    async findMe(
        @Param('teamId') teamId: number,
        @Param('memberId') memberId: number,
    ) {
        const data = await this.memberService.findOneById(memberId);

        return {
            statusCode: HttpStatus.OK,
            message: '선수 정보 조회에 성공했습니다.',
            data,
        };
    }

    /**
     *멤버 추가
     * @param teamId
     * @param  memberId
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post(':teamId/:userId')
    async registerMember(
        @Param('teamId') teamId: number,
        @Param('userId') userId: number,
        @Req() req: Request,
    ) {
        const currentLoginUserId: number = req['user'].id;
        await this.memberService.registerMember(
            currentLoginUserId,
            teamId,
            userId,
        );

        return {
            statusCode: HttpStatus.OK,
            success: true,
        };
    }

    /**
     * 멤버 추방하기
     * @param teamId
     * @param userId
     * @param req
     */
    @UseGuards(JwtAuthGuard)
    @Delete(':teamId/:userId')
    async deleteMemeber(
        @Param('teamId') teamId: number,
        @Param('userId') userId: number,
        @Req() req: Request,
    ) {
        const currentLoginUserId: number = req['user'].id;
        await this.memberService.deleteMember(
            currentLoginUserId,
            teamId,
            userId,
        );

        return {
            statusCode: HttpStatus.OK,
            success: true,
        };
    }

    /**
     * 선수 정보 수정
     * @param teamId
     * @param  memberId
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Put(':teamId/:playerId')
    async updatePlayerInfo(
        @Param('teamId') teamId: number,
        @Param('memberId') memberId: number,
        @Body() updateMemberInfoDto: UpdateMemberInfoDto,
    ) {
        // const data = await this.memberService.updatePlayerInfo(
        //     memberId,
        //     updateMemberInfoDto,
        // );
        // return {
        //     statusCode: HttpStatus.OK,
        //     message: '선수 정보 수정에 성공했습니다.',
        //     data,
        // };
    }

    /**
     * 선수 탈퇴
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Delete(':teamId/:playerId')
    async deleteMe(
        @Param('teamId') teamId: number,
        @Param('memberId') memberId: number,
    ) {
        // const data = await this.memberService.deleteId(memberId);
        // return {
        //     statusCode: HttpStatus.OK,
        //     message: '선수 탈퇴에 성공했습니다.',
        //     data,
        // };
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Patch(':teamId')
    async updateIsStaff(
        @Param('teamId') teamId: number,
        @Req() req: Request,
        @Body() updateDto: UpdateMemberInfoDto,
    ) {
        const currentLoginUserId: number = req['user'].id;
        const updatedMember = await this.memberService.updateIsStaff(
            teamId,
            currentLoginUserId,
            updateDto,
        );

        return {
            statusCode: HttpStatus.OK,
            success: true,
        };
    }
}
