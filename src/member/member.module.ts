import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from './entities/member.entity';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { UserModule } from 'src/user/user.module';
import { TeamModule } from 'src/team/team.module';
import { EmailModule } from 'src/email/email.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Member]),
        AuthModule,
        UserModule,
        forwardRef(() => TeamModule),
        EmailModule,
        RedisModule,
    ],
    controllers: [MemberController],
    providers: [MemberService],
    exports: [MemberService],
})
export class MemberModule {}
