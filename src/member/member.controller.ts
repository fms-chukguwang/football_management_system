import {
    Body,
    Controller,
    Delete,
    Param,
    Post,
    UseGuards,
    HttpStatus,
    Patch,
    Req,
    ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MemberService } from './member.service';
import { UpdateMemberInfoDto } from './dtos/update-member-info-dto';
import { IsStaffGuard } from './guard/is-staff.guard';

@ApiTags('선수')
@Controller()
export class MemberController {
    constructor(private readonly memberService: MemberService) {}

    /**
     *멤버 추가
     * @param teamId
     * @param  memberId
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, IsStaffGuard)
    @Post('team/:teamId/user/:userId')
    async registerMember(@Param('teamId') teamId: number, @Param('userId') userId: number) {
        console.log('컨트롤러 진입');
        const registerMember = await this.memberService.registerMember(teamId, userId);

        return {
            statusCode: HttpStatus.OK,
            data: registerMember,
            success: true,
        };
    }

    /**
     * 멤버 추방하기
     * @param teamId
     * @param userId
     * @param req
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, IsStaffGuard)
    @Delete('/team/:teamId/member/:memberId')
    async deleteMemeber(@Param('teamId') teamId: number, @Param('memberId') memberId: number) {
        const deleteMember = await this.memberService.deleteMember(teamId, memberId);

        return {
            statusCode: HttpStatus.OK,
            data: deleteMember,
            success: true,
        };
    }

    /**
     * 입단일 수정기능(스태프용)
     * @param updateDto
     * @param memberId
     * @param teamId
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, IsStaffGuard)
    @Patch('/team/:teamId/member/:memberId/join-date')
    async updateStaffJoinDate(
        @Body() updateDto: UpdateMemberInfoDto,
        @Param('memberId', ParseIntPipe) memberId: number,
        @Param('teamId', ParseIntPipe) teamId: number,
    ) {
        const updateJoinDate = await this.memberService.updateStaffJoinDate(
            memberId,
            teamId,
            updateDto,
        );

        return {
            statusCode: HttpStatus.OK,
            data: updateJoinDate,
            success: true,
        };
    }

    /**
     * 입단일 수정기능
     * @param updateDto
     * @param memberId
     * @param teamId
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Patch('/team/:teamId/member/join-date')
    async updateMemberJoinDate(
        @Body() updateDto: UpdateMemberInfoDto,
        @Param('teamId') teamId: number,
        @Req() req: Request,
    ) {
        const userId = req['user'].id;

        const updateJoinDate = await this.memberService.updateMemberJoinDate(
            userId,
            teamId,
            updateDto,
        );

        return updateJoinDate;
    }

    /**
     * 스태프 권한주기
     * @param teamId
     * @param req
     * @param updateDto
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, IsStaffGuard)
    @Patch('/team/:teamId/member/:memberId/staff')
    async updateIsStaff(
        @Param('teamId') teamId: number,
        @Param('memberId') memberId: number,
        @Body() updateDto: UpdateMemberInfoDto,
    ) {
        const updatedMember = await this.memberService.updateIsStaff(teamId, memberId, updateDto);

        return {
            statusCode: HttpStatus.OK,
            data: updatedMember,
            success: true,
        };
    }
}
