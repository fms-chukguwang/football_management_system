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
    UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { request } from 'express';
import { UpdateProfileInfoDto } from './dtos/update-profile-info-dto';
import { RegisterProfileInfoDto } from './dtos/register-profile-info';
import { QueryRunner } from 'typeorm';
import { TransactionInterceptor } from 'src/common/interceptors/transaction.interceptor';
import { qr } from 'src/common/decorators/qr.decorator';
@ApiTags('프로필')
@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    /**
     * 프로필 정보 조회
     * @param req
     * @returns
     */
    @Get('/:profileId')
    async findMe(@Param('profileId') profileId: number) {
        const data = await this.profileService.findOneById(profileId);

        return {
            statusCode: HttpStatus.OK,
            message: '프로필 정보 조회에 성공했습니다.',
            data,
        };
    }

    /**
     * 프로필 등록
     * @param teamId
     * @param  memberId
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(TransactionInterceptor)
    @Post(':userId/register')
    async registerprofile(
        @Request() req,
        @Body() registerProfileInfoDto: RegisterProfileInfoDto,
        @qr() qr?: QueryRunner,
    ) {
        const data = await this.profileService.registerProfile(
            req.user.id,
            registerProfileInfoDto,
            qr,
        );

        return {
            statusCode: HttpStatus.OK,
            message: '프로필 등록에 성공했습니다.',
            data,
        };
    }

    /**
     * 프로필 정보 수정
     * @param teamId
     * @param  memberId
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Put(':profileId')
    async updateprofileInfo(@Request() req, @Body() updateProfileInfoDto: UpdateProfileInfoDto) {
        const data = await this.profileService.updateProfileInfo(req.user.id, updateProfileInfoDto);

        return {
            statusCode: HttpStatus.OK,
            message: '프로필 정보 수정에 성공했습니다.',
            data,
        };
    }

    /**
     * 테스트용! 프로필 정보 삭제
     * @param teamId
     * @param  memberId
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Delete(':teamId/:profileId')
    async deleteProfileInfo(@Param('profileId') profileId: number) {
        const data = await this.profileService.deleteProfile(profileId);

        return {
            statusCode: HttpStatus.OK,
            message: '프로필 정보 삭제에 성공했습니다.',
            data,
        };
    }
}
