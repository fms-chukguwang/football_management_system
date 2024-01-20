import { DataFactory, Seeder } from 'nestjs-seeder';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamModel } from '../team/entities/team.entity';

@Injectable()
export class TeamSeed implements Seeder {
  constructor(
    @InjectRepository(TeamModel)
    private teamRepository: Repository<TeamModel>,
  ) {}

  seed(): Promise<any> {
    const team = DataFactory.createForClass(TeamModel).generate(50);

    return this.teamRepository.insert(team);
  }
  drop(): Promise<any> {
    return this.teamRepository.delete({});
  }
}
