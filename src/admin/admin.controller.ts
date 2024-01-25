import { Body, Controller, Delete, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginateUserDto } from './dto/paginate-user.dto';
import { PaginateTeamDto } from './dto/paginate-team.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsAdminGuard } from './guards/isAdmin.guard';
import { Request } from 'express';
import { UserService } from '../user/user.service';

/**
 * 확인해야할 권한
 * 1. 로그인 여부
 * 2. 관리자 여부
 */

@ApiTags('관리자')
@UseGuards(JwtAuthGuard, IsAdminGuard)
@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly userService: UserService,
    ) {}

    /**
     * 팀 목록 가져오기(전체 팀, 페이징 적용)
     * @param dto
     * @returns
     */
    @ApiBearerAuth()
    @Get('teams')
    async getAllTeams(@Query() dto: PaginateTeamDto) {
        return await this.adminService.getAllTeams(dto);
    }

    /**
     * 유저 목록 가져오기(전체 유저, 페이징 적용)
     * @param dto
     * @returns
     */
    @ApiBearerAuth()
    @Get('users')
    async getAllUsers(@Query() dto: PaginateUserDto, @Req() req: Request) {
        return await this.adminService.paginateUser(dto);
    }

    // 추가적인 로직 필요할듯? User에 조회, 삭제 없애야할듯
    /**
     * 유저 삭제하기
     * @param dto
     * @returns
     */
    @ApiBearerAuth()
    @Delete('/:dataType/:userId')
    async deleteUserById(@Param('dataType') dataType: string, @Param('userId') userId: number) {
        if (dataType === 'users') {
            console.log('userId');
            console.log(userId);
            return await this.userService.deleteId(userId);
        } else if (dataType === 'teams') {
            // return await this.adminService.deleteTeamById(userId);
        }
    }
}
