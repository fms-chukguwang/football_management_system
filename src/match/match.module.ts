import { Module } from '@nestjs/common';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Match } from './entities/match.entity';
<<<<<<< HEAD
import { EmailService } from 'src/email/email.service';
import { AuthService } from 'src/auth/auth.service';
=======
import { EmailService } from '../email/email.service';
import { EmailVerification } from '../email/entities/email.entity';
import { AuthService } from '../auth/auth.service';
>>>>>>> 64d43b7c012aeda419197286e6794b049bbe1f41
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
