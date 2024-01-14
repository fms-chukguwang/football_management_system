import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Player } from './entities/player.entity';
import { Repository } from 'typeorm';
import { compare } from 'bcrypt';
import { UpdatePlayerInfoDto } from './dtos/update-player-info-dto';
import { RegisterPlayerInfoDto } from './dtos/register-player-info';

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(Player)
    private readonly PlayerRepository: Repository<Player>,
  ) {}

  async findAllPlayers() {
    const Players = await this.PlayerRepository.find();

    if (!Players) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    return Players;
  }

  async findOneById(id: number) {
    const Player = await this.PlayerRepository.findOneBy({ id });
    console.log('Player=', Player);

    if (!Player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    return Player;
  }

  async findOneByName(name: string): Promise<Player | null> {
    const Player = await this.PlayerRepository.findOneBy({ name });

    if (!Player) {
      throw new NotFoundException(`이름을 찾을수 없습니다`);
    }

    return Player;
  }

  async registerPlayerPosition(
    id: number,
    registerPlayerInfoDto: RegisterPlayerInfoDto,
  ): Promise<Player> {
    try {
      const Player = await this.PlayerRepository.findOneBy({ id });

      if (!Player) {
        throw new Error('Player not found');
      }

      if (registerPlayerInfoDto.name) {
        Player.name = registerPlayerInfoDto.name;
      }

      if (registerPlayerInfoDto.position) {
        Player.position = registerPlayerInfoDto.position;
      }

      const registeredPlayer = await this.PlayerRepository.save(Player);

      return registeredPlayer;
    } catch (error) {
      console.error('Error updating Player info:', error.message);
      throw new Error('Failed to update Player info');
    }
  }

  async updatePlayerInfo(
    id: number,
    updatePlayerInfoDto: UpdatePlayerInfoDto,
  ): Promise<Player> {
    try {
      const Player = await this.PlayerRepository.findOneBy({ id });

      if (!Player) {
        throw new Error('Player not found');
      }

      if (updatePlayerInfoDto.name) {
        Player.name = updatePlayerInfoDto.name;
      }

      if (updatePlayerInfoDto.position) {
        Player.position = updatePlayerInfoDto.position;
      }

      const updatedPlayer = await this.PlayerRepository.save(Player);

      return updatedPlayer;
    } catch (error) {
      console.error('Error updating Player info:', error.message);
      throw new Error('Failed to update Player info');
    }
  }

  async deleteId(id: number) {
    const Player = await this.PlayerRepository.findOneBy({ id });

    if (!Player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    // 선수 삭제
    await this.PlayerRepository.remove(Player);

    return Player;
  }
}
