import { Module } from '@nestjs/common';
import { FormationController } from './formation.controller';
import { FormationService } from './formation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../member/entities/member.entity';
import { TeamModel } from '../team/entities/team.entity';
import { Match } from '../match/entities/match.entity';
import { MatchFormation } from './entities/formation.entity';
import { User } from '../user/entities/user.entity';
import { PlayerStats } from '../match/entities/player-stats.entity';
import { MatchResult } from '../match/entities/match-result.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Member,TeamModel,Match,MatchFormation,User,PlayerStats,MatchResult],),
],
  controllers: [FormationController],
  providers: [
              FormationService,  
            ],
  exports: [FormationService],
})
export class FormationModule {}
