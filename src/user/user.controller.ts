import { Body, Controller, Delete, Get, HttpStatus, Put, Request, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateMyInfoDto } from '../auth/dtos/update-my-info.dto';

@ApiTags('사용자')
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    /**
     * 내 정보 조회
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('/me')
    async findMe(@Request() req) {
        const userId = req.user.id;
        const data = await this.userService.findOneById(userId);
        return {
            statusCode: HttpStatus.OK,
            message: '내 정보 조회에 성공했습니다.',
            data,
        };
    }

    /**
     * 내 정보 수정
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Put('/me')
    async updateMyInfo(@Request() req, @Body() updateMyInfoDto: UpdateMyInfoDto) {
        const userId = req.user.id;

        const data = await this.userService.updateMyInfo(userId, updateMyInfoDto);

        return {
            statusCode: HttpStatus.OK,
            message: '내 정보 수정에 성공했습니다.',
            data,
        };
    }

    /**
     * 회원 탈퇴
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Delete('/me')
    async deleteMe(@Request() req) {
        const userId = req.user.id;

        const data = await this.userService.deleteId(userId);

        return {
            statusCode: HttpStatus.OK,
            message: '회원탈퇴에 성공했습니다.',
            data,
        };
    }
}
