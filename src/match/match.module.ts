import { Module } from '@nestjs/common';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Match } from './entities/match.entity';
import { EmailService } from '../email/email.service';
import { EmailVerification } from '../email/entities/email.entity';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { MatchResult } from './entities/match-result.entity';
import { PlayerStats } from './entities/player-stats.entity';
import { RedisService } from '../redis/redis.service';
import { TeamStats } from './entities/team-stats.entity';
import { TeamModel } from '../team/entities/team.entity';
import { Member } from '../member/entities/member.entity';
import { SoccerField } from './entities/soccer-field.entity';
import { TeamJoinRequestToken } from 'src/email/entities/team-join-request-token.entity';
import { AwsService } from 'src/aws/aws.service';

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
    providers: [MatchService, EmailService, AuthService, JwtService, UserService, AwsService, RedisService],
})
export class MatchModule {}
