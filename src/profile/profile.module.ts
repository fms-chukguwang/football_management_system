import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { User } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { MemberModule } from '../member/member.module';
import { Member } from '../member/entities/member.entity';
import { CommonModule } from '../common/common.module';
import { AwsModule } from '../aws/aws.module';
import { LocationModule } from 'src/location/location.module';
import { LocationModel } from 'src/location/entities/location.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Profile, Member,LocationModel]),
        AuthModule,
        UserModule,
        MemberModule,
        CommonModule,
        AwsModule,
        LocationModule
    ],
    controllers: [ProfileController],
    providers: [ProfileService],
    exports: [ProfileService],
})
export class ProfileModule {}
