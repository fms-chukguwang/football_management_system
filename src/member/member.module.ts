import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from './entities/member.entity';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
<<<<<<< HEAD
import { UserModule } from 'src/user/user.module';
import { TeamModule } from 'src/team/team.module';
import { EmailModule } from 'src/email/email.module';
import { RedisModule } from 'src/redis/redis.module';
=======
import { UserModule } from '../user/user.module';
import { TeamModule } from '../team/team.module';
import { EmailModule } from '../email/email.module';
>>>>>>> 64d43b7c012aeda419197286e6794b049bbe1f41

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
