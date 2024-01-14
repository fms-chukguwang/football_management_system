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
import { PlayerService } from './player.service';
import { UpdatePlayerInfoDto } from './dtos/update-player-info-dto';
import { request } from 'express';
import { RegisterPlayerInfoDto } from './dtos/register-player-info';

@ApiTags('선수')
@Controller('player')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  /**
   * 전체 선수 정보 조회
   * @param req
   * @returns
   */
  @Get('')
  async allplayers() {
    const data = await this.playerService.findAllPlayers();

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
    const data = await this.playerService.findOneById(memberId);

    return {
      statusCode: HttpStatus.OK,
      message: '선수 정보 조회에 성공했습니다.',
      data,
    };
  }

  /**
   * 선수 등록
   * @param teamId
   * @param  memberId
   * @returns
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':teamId/:playerId')
  async registerPlayer(
    @Param('teamId') teamId: number,
    @Param('memberId') memberId: number,
    @Body() registerPlayerInfoDto: RegisterPlayerInfoDto,
  ) {
    const data = await this.playerService.registerPlayerPosition(
      memberId,
      registerPlayerInfoDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '선수 포지션 등록에 성공했습니다.',
      data,
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
    @Body() updatePlayerInfoDto: UpdatePlayerInfoDto,
  ) {
    const data = await this.playerService.updatePlayerInfo(
      memberId,
      updatePlayerInfoDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: '선수 정보 수정에 성공했습니다.',
      data,
    };
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
    const data = await this.playerService.deleteId(memberId);

    return {
      statusCode: HttpStatus.OK,
      message: '선수 탈퇴에 성공했습니다.',
      data,
    };
  }
}
