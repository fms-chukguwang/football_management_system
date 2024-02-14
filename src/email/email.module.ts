import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './email.service';
import { EmailVerification } from './entities/email.entity';
import { TeamJoinRequestToken } from './entities/team-join-request-token.entity';
import { RedisModule } from '../redis/redis.module';
import { Profile } from 'src/profile/entities/profile.entity';

@Module({
    imports: [TypeOrmModule.forFeature([EmailVerification, TeamJoinRequestToken, Profile]),  RedisModule],
   
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule {}
