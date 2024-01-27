import { Module } from '@nestjs/common';
import { FormationController } from './formation.controller';
import { FormationService } from './formation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from 'src/member/entities/member.entity';
import { TeamModel } from 'src/team/entities/team.entity';
import { Match } from 'src/match/entities/match.entity';
import { MatchFormation } from './entities/formation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member,TeamModel,Match,MatchFormation]),
],
  controllers: [FormationController],
  providers: [FormationService]
})
export class FormationModule {}
