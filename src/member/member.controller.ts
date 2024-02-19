import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    InternalServerErrorException,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailService } from '../email/email.service';
import { TeamModel } from '../team/entities/team.entity';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginateMembersDto } from './dtos/paginate-members-dto';
import { UpdateMemberInfoDto } from './dtos/update-member-info-dto';
import { IsMemberGuard } from './guard/is-member.guard';
import { IsStaffGuard } from './guard/is-staff.guard';
import { MemberService } from './member.service';

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

    // //TODO TESTING
    // /**
    //  * 많은 멤버 팀에 추가하기
    //  * @param userId
    //  * @param teamId
    //  * @returns
    //  */
    // @Post('register-many-members/:teamId')
    // async registerManyMembers(@Param('teamId') teamId: number, @Body() userIds: number[]) {
    //     const registerMembers = await this.memberService.registerManyMembers(teamId, userIds);

    //     return {
    //         statusCode: HttpStatus.OK,
    //         data: registerMembers,
    //         success: true,
    //     };
    // }
    //     return {
    //         statusCode: HttpStatus.OK,
    //         data: registerMembers,
    //         success: true,
    //     };
    // }

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
        console.log('controller userId=', userId);
        this.memberService.sendInvitingEmail(userId, teamId, profileId);
    }

    @ApiBearerAuth()
    @Post('/team/:teamId/user/:userId/approve')
    async approveMember(
        @Param('teamId') teamId: number,
        @Param('userId') userId: number,
        @Body('token') token: string,
    ) {
        try {
            await this.memberService.verifyEmailToken(token);

            const result = await this.memberService.registerMember(teamId, userId);

            await this.memberService.deleteEmailToken(token);

            return '회원 수락 처리 완료';
        } catch (error) {
            if (error instanceof BadRequestException) {
                return { message: error.message };
            } else {
                return { message: '알 수 없는 오류가 발생했습니다.' };
            }
        }
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
        @Param('teamId') teamId: number,
        @Param('userId') userId: number,
        @Body('token') token: string,
    ) {
        try {
            await this.memberService.verifyEmailToken(token);

            const result = await this.memberService.rejectJoiningEamil(teamId, userId);

            await this.memberService.deleteEmailToken(token);

            return '회원 거절 처리 완료';
        } catch (error) {
            if (error instanceof BadRequestException) {
                return { message: error.message };
            } else {
                return { message: '알 수 없는 오류가 발생했습니다.' };
            }
        }
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

    /**
     * 멤버 강퇴
     * @param req
     * @returns
     */
    @UseGuards(JwtAuthGuard)
    @Delete('team/:teamId/member/:memberId/expulsion')
    async expulsionMember(
        @Req() req: Request,
        @Param('teamId') teamId: number,
        @Param('memberId') memberId: number,
    ) {
        try {
            await this.memberService.expulsionMember(teamId, memberId, req['user'].id);

            return {
                statusCode: HttpStatus.OK,
                message: '탈퇴처리가 되었습니다.',
                success: true,
            };
        } catch (err) {
            throw new InternalServerErrorException('처리중에 서버에서 문제가 생겼습니다.');
        }
    }
}
