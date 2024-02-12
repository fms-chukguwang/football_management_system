import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from './entities/member.entity';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { UserModule } from '../user/user.module';
import { TeamModule } from '../team/team.module';
import { EmailModule } from '../email/email.module';
import { RedisModule } from '../redis/redis.module';
import { TeamModel } from '../team/entities/team.entity';
import { ChatsModule } from '../chats/chats.module';
import { CommonModule } from '../common/common.module';
import { ProfileModule } from 'src/profile/profile.module';
import { MemberGateway } from './member.gateway';
import { ChatsGateway } from 'src/chats/chats.gateway';

@Module({
    imports: [
        TypeOrmModule.forFeature([Member, TeamModel]),
        AuthModule,
        UserModule,
        forwardRef(() => TeamModule),
        CommonModule,
        EmailModule,
        RedisModule,
        ChatsModule,
        forwardRef(() => ProfileModule),
    ],
    controllers: [MemberController],
    providers: [MemberService, MemberGateway],
    exports: [MemberService],
})
export class MemberModule {}
