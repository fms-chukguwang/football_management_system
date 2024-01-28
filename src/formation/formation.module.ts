import { Module } from '@nestjs/common';
import { FormationController } from './formation.controller';
import { FormationService } from './formation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../member/entities/member.entity';
import { TeamModel } from '../team/entities/team.entity';
import { Match } from '../match/entities/match.entity';
import { MatchFormation } from './entities/formation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member,TeamModel,Match,MatchFormation]),
],
  controllers: [FormationController],
  providers: [FormationService]
})
export class FormationModule {}
