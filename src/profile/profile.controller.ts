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
    Query,
    UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { request } from 'express';
import { UpdateProfileInfoDto } from './dtos/update-profile-info-dto';
import { QueryRunner } from 'typeorm';
import { TransactionInterceptor } from '../common/interceptors/transaction.interceptor';
import { qr } from '../common/decorators/qr.decorator';
import { PaginateProfileDto } from './dtos/paginate-profile-dto';
import { IsStaffGuard } from '../member/guard/is-staff.guard';
import { FileInterceptor } from '@nestjs/platform-express';
@ApiTags('프로필')
@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}
    /**
     * 유저 팀이름  조회
     * @param req
     * @returns
     */
    //     @Get('team/:user_id')
    //   async getTeamNameByUserId(@Param('user_id') userId: string) {
    //     const teamName = await this.profileService.getTeamNameByUserId(userId);
    //     return { teamName };
    //   }
    /**
     * 전체 프로필 정보 조회
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('')
    async findAllProfiles(@Request() req, @Query() dto: PaginateProfileDto) {
        const userId = req.user.id;
        const data = await this.profileService.paginateMyProfile(userId, dto, dto.name);
        return {
            statusCode: HttpStatus.OK,
            message: '전체 프로필 정보 조회에 성공했습니다.',
            data,
        };
    }

    /**
     * 팀없는 프로필 정보 조회
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('/available/')
    async findAvailableProfiles(@Request() req, @Query() dto: PaginateProfileDto) {
        const userId = req.user.id;
        const data = await this.profileService.paginateProfile(userId, dto, dto.name);
        return {
            statusCode: HttpStatus.OK,
            message: '팀없는 프로필 정보 조회에 성공했습니다.',
            data,
        };
    }

    //   @Get('search')
    //   async searchProfiles( @Query('name') name: string) {
    //     const data = await this.profileService.searchProfile(name);
    //     return {
    //       statusCode: HttpStatus.OK,
    //       message: '전체 프로필 정보 조회에 성공했습니다.',
    //       data,
    //     };
    //   }
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
    @Post()
    @UseGuards(JwtAuthGuard)
    // @UseInterceptors(Transa3ctionInterceptor)
    @UseInterceptors(FileInterceptor('file'))
    async registerprofile(
        @Request() req,
        @Body() registerProfileInfoDto: any,
        @UploadedFile() file: Express.Multer.File,
    ) {
        console.log('data from frontend', registerProfileInfoDto);
        console.log('file from frontend', file);
        const data = await this.profileService.registerProfile(
            req.user.id,
            registerProfileInfoDto,
            file,
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
    @UseInterceptors(FileInterceptor('file'))
    async updateprofileInfo(
        @Request() req,
        @Body() updateProfileInfoDto: any,
        @UploadedFile() file: Express.Multer.File,
    ) {
        console.log('updateProfileInfoDto', updateProfileInfoDto);
        const data = await this.profileService.updateProfileInfo(
            req.user.id,
            updateProfileInfoDto,
            file,
        );

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
