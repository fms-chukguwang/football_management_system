import { Module } from '@nestjs/common';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Match } from './entities/match.entity';
import { EmailService } from 'src/email/email.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';
import { MatchResult } from './entities/match-result.entity';
import { PlayerStats } from './entities/player-stats.entity';
import { RedisService } from 'src/redis/redis.service';
import { TeamStats } from './entities/team-stats.entity';
import { TeamModel } from 'src/team/entities/team.entity';
import { Member } from 'src/member/entities/member.entity';
import { SoccerField } from './entities/soccer-field.entity';
import { EmailVerification } from 'src/email/entities/email.entity';
import { TeamJoinRequestToken } from 'src/email/entities/team-join-request-token.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Match,
            MatchResult,
            User,
            Member,
            SoccerField,
            TeamModel,
            PlayerStats,
            TeamStats,
            EmailVerification,
            TeamJoinRequestToken,
        ]),
        AuthModule,
    ],
    controllers: [MatchController],
    providers: [MatchService, EmailService, AuthService, JwtService, UserService, RedisService],
})
export class MatchModule {}
