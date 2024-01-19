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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { request } from 'express';
import { UpdateProfileInfoDto } from './dtos/update-profile-info-dto';
import { RegisterProfileInfoDto } from './dtos/register-profile-info';
@ApiTags('프로필')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * 프로필 정보 조회
   * @param req
   * @returns
   */
  @Get(':teamId/:profileId')
  async findMe(
    @Param('teamId') teamId: number,
    @Param('memberId') memberId: number,
  ) {
    const data = await this.profileService.findOneById(memberId);

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
  @Post(':teamId/:profileId')
  async registerprofile(
    @Param('teamId') teamId: number,
    @Param('memberId') memberId: number,
    @Body() registerProfileInfoDto: RegisterProfileInfoDto,
  ) {
    const data = await this.profileService.registerprofile(
      memberId,
      registerProfileInfoDto,
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
  @Put(':teamId/:profileId')
  async updateprofileInfo(
    @Param('teamId') teamId: number,
    @Param('memberId') memberId: number,
    @Body() updateProfileInfoDto: UpdateProfileInfoDto,
  ) {
    const data = await this.profileService.updateprofileInfo(
      memberId,
      updateProfileInfoDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '프로필 정보 수정에 성공했습니다.',
      data,
    };
  }

}
