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
    Get,
    BadRequestException,
    Query,
    Response,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MemberService } from './member.service';
import { UpdateMemberInfoDto } from './dtos/update-member-info-dto';
import { IsStaffGuard } from './guard/is-staff.guard';
import { PaginateMembersDto } from './dtos/paginate-members-dto';
import { IsMemberGuard } from './guard/is-member.guard';
import { EmailService } from 'src/email/email.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { TeamModel } from 'src/team/entities/team.entity';

@ApiTags('선수')
@Controller()
export class MemberController {
    constructor(
        private readonly emailService: EmailService,
        private readonly memberService: MemberService,
    ) {}
    @InjectRepository(User)
    private readonly userRepository: Repository<User>;
    @InjectRepository(TeamModel)
    private readonly teamRepository: Repository<TeamModel>;
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
        const registerMember = await this.memberService.registerMember(teamId, userId);

        return {
            statusCode: HttpStatus.OK,
            data: registerMember,
            success: true,
        };
    }

    //TODO TESTING
    /**
     * 많은 멤버 팀에 추가하기
     * @param userId
     * @param teamId
     * @returns
     */
    @Post('register-many-members/:teamId')
    async registerManyMembers(@Param('teamId') teamId: number, @Body() userIds: number[]) {
        const registerMembers = await this.memberService.registerManyMembers(teamId, userIds);

        return {
            statusCode: HttpStatus.OK,
            data: registerMembers,
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

    /**
     * 구단 입단시 이메일로 요청하기
     * @param req
     * @param teamId
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('/team/:teamId')
    sendJoiningEmail(@Req() req: Request, @Param('teamId') teamId: number) {
        const userId = req['user'].id;

        this.memberService.sendJoiningEmail(userId, teamId);
    }

    /**
     * 멤버를 팀으로 초대
     * @param req
     * @param teamId
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('/team/:teamId/:profileId')
    sendInvitingEmail(
        @Req() req: Request,
        @Param('teamId') teamId: number,
        @Param('profileId') profileId: number,
    ) {
        const userId = req['user'].id;

        this.memberService.sendInvitingEmail(userId, teamId, profileId);
    }

    @ApiBearerAuth()
    @Post('/team/:teamId/user/:userId/approve')
    async approveMember(
        @Param('teamId') teamId: number,
        @Param('userId') userId: number,
        @Body('token') token: string,
    ) {
        await this.memberService.verifyEmailToken(token);

        const result = await this.memberService.registerMember(teamId, userId);

        await this.memberService.deleteEmailToken(token);
        const owner = await this.teamRepository.findOne({
            where: { id: teamId },
        });
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        // 이메일에 알람 메시지 포함 (구단주에게)
        const ownerEmailContent = `
        회원 수락 처리 완료!
        구단주에게 보내는 내용입니다.
        `;

        // 이메일에 알람 메시지 포함 (멤버에게)
        const memberEmailContent = `
        회원 수락 처리 완료!
        멤버에게 보내는 내용입니다.
        `;

        // 구단주에게 이메일 전송
        //await this.emailService.sendEmail(owner.creator.email, "회원 수락 처리 완료", ownerEmailContent);

        // 멤버에게 이메일 전송
        await this.emailService.sendEmail(user.email, '회원 수락 처리 완료', memberEmailContent);
    }

    /**
     * 회원 거절 api
     * @param teamId
     * @param userId
     * @returns
     */
    @ApiBearerAuth()
    @Post('/team/:teamId/user/:userId/reject')
    async rejectMember(
        teamId: number,
        userId: number,
        token: string,
    ) {
        await this.memberService.verifyEmailToken(token);
    
        const result = await this.memberService.rejectJoiningEamil(teamId, userId);
    
        await this.memberService.deleteEmailToken(token);
    
        const owner = await this.teamRepository.findOne({
            where: { id: teamId },
        });
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
    
        // 이메일에 알람 메시지 포함 (구단주에게)
        const ownerEmailContent = `
           회원 거절 처리 완료!
            구단주에게 보내는 내용입니다.
        `;
    
        // 이메일에 알람 메시지 포함 (멤버에게)
        const memberEmailContent  = `
                회원 거절 처리 완료!
                멤버에게 보내는 내용입니다.
   
        `;
        // 구단주에게 이메일 전송
        // await this.emailService.sendEmail(owner.creator.email, "회원 거절 처리 완료", ownerEmailContent);
    
        // 멤버에게 이메일 전송
        await this.emailService.sendEmail(user.email, '회원 거절 처리 완료', memberEmailContent);
    }
    

    /**
     * 팀별 멤버 목록 조회
     * @param req
     * @param teamId
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('/team/:teamId/members')
    async getTeamMembers(
        @Req() req: Request,
        @Param('teamId') teamId: number,
        @Query() dto: PaginateMembersDto,
    ) {
        const data = await this.memberService.getTeamMembers(teamId, dto, dto.name);

        // return {
        //     statusCode: HttpStatus.OK,
        //     data,
        //     success: true,
        // };
        return data;
    }

    /**
     * 멤버 상세조회
     * @param req
     * @returns
     */
    @UseGuards(JwtAuthGuard, IsMemberGuard)
    @Get('team/:teamId/member/:memberId')
    getMember(@Req() req: Request) {
        return this.memberService.getMember(req['member'].team.id, req['member'].id);
    }
}
