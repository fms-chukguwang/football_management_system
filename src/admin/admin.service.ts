import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { FindManyOptions, Repository } from 'typeorm';
import { PaginateUserDto } from './dto/paginate-user.dto';
import { CommonService } from '../common/common.service';
import { PaginateTeamDto } from './dto/paginate-team.dto';
import { TeamModel } from 'src/team/entities/team.entity';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(TeamModel)
        private readonly teamRepository: Repository<TeamModel>,
        private readonly commonService: CommonService,
    ) {}
    async getAllTeams(dto: PaginateTeamDto) {
        return await this.commonService.paginate(dto, this.teamRepository, {}, 'teams');
    }

    async paginateUser(dto: PaginateUserDto) {
        return await this.commonService.paginate(
            dto,
            this.userRepository,
            {
                relations: ['team'],
            },
            'users',
        );
    }
}
