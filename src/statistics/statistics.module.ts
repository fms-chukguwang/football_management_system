import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../member/entities/member.entity';
import { TeamStats } from '../match/entities/team-stats.entity';
import { MatchResult } from '../match/entities/match-result.entity';
import { PlayerStats } from '../match/entities/player-stats.entity';
import { RedisModule } from 'src/redis/redis.module';
import { MemberModule } from '../member/member.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TeamStats, MatchResult, PlayerStats, Member]),
        MemberModule,
        RedisModule,
    ],
    controllers: [StatisticsController],
    providers: [StatisticsService],
})
export class StatisticsModule {}
