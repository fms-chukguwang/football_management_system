import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
    Request,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { request } from 'express';
import { UpdateProfileInfoDto } from './dtos/update-profile-info-dto';
import { QueryRunner } from 'typeorm';
import { TransactionInterceptor } from '../common/interceptors/transaction.interceptor';
import { qr } from '../common/decorators/qr.decorator';
import { PaginateProfileDto } from './dtos/paginate-profile-dto';
@ApiTags('프로필')
@Controller('profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

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
    @Get('/available')
    async findAvailableProfiles(@Request() req, @Query() dto: PaginateProfileDto) {
        const userId = req.user.id;
        const data = await this.profileService.paginateProfile(
            dto,
            dto.gender,
            dto.name,
            dto.region,
        );
        return {
            statusCode: HttpStatus.OK,
            message: '팀없는 프로필 정보 조회에 성공했습니다.',
            data,
        };
    }

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
    @UseInterceptors(FileInterceptor('file'))
    async registerprofile(
        @Request() req,
        @Body() registerProfileInfoDto: any,
        @UploadedFile() file: Express.Multer.File,
    ) {
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
        @UploadedFile() file?: Express.Multer.File,
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
}
