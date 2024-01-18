import { Module } from '@nestjs/common';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Match } from './entities/match.entity';
import { EmailService } from 'src/email/email.service';
import { EmailVerification } from 'src/email/entities/email.entity';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';
import { MatchResult } from './entities/match-result.entity';
import { PlayerStats } from './entities/player-stats.entity';
import { RedisService } from 'src/redis/redis.service';
import { TeamStats } from './entities/team-stats.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Match,MatchResult,User,PlayerStats,TeamStats,EmailVerification]),AuthModule],
  controllers: [MatchController],
  providers: [MatchService,EmailService,AuthService,JwtService,UserService,RedisService]
})
export class MatchModule {}
