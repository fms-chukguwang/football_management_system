import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { PaginateUserDto } from './dto/paginate-user.dto';
import { CommonService } from 'src/common/common.service';
import { PaginateTeamDto } from './dto/paginate-team.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    // @InjectRepository(Team)
    // private readonly teamRepository: Repository<Team>,
    private readonly commonService: CommonService,
  ) {}
  async getAllTeams(dto: PaginateTeamDto) {
    return 'All Teams';
  }

  async paginateUser(dto: PaginateUserDto) {
    return await this.commonService.paginate(
      dto,
      this.userRepository,
      {},
      'users',
    );
  }
}
