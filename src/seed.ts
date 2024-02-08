import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { seeder } from 'nestjs-seeder';
import { Chats } from './chats/entities/chats.entity';
import { configModuleValidationSchema } from './configs/env-validation.config';
import { LocationModel } from './location/entities/location.entity';
import { Member } from './member/entities/member.entity';
import { Message } from './messages/entities/messages.entity';
import { Profile } from './profile/entities/profile.entity';
import { LocationSeed } from './seed/location.seed';
import { MemberSeed } from './seed/member.seed';
import { ProfileSeed } from './seed/profile.seed';
import { TeamSeed } from './seed/team.seed';
import { UserSeed } from './seed/user.seed';
import { TeamModel } from './team/entities/team.entity';
import { User } from './user/entities/user.entity';
seeder({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configModuleValidationSchema,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      //  autoLoadEntities: true,
      entities: [User,Profile,LocationModel,TeamModel,,Member,Chats,Message],
      synchronize: process.env.DB_SYNC === 'true',
    }),

    TypeOrmModule.forFeature([User,LocationModel,Profile,TeamModel,,Member,Chats,Message]),
  ],
}).run([UserSeed,LocationSeed, ProfileSeed, TeamSeed,MemberSeed]);
