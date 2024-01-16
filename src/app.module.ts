import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configModuleValidationSchema } from './configs/env-validation.config';
import { typeOrmModuleOptions } from './configs/database.config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TeamMemberController } from './manager/manager.controller';
import { TeamMemberModule } from './manager/manager.module';
import { PlayerModule } from './player/player.module';
//import { RedisModule } from 'nestjs-redis';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configModuleValidationSchema,
    }),
    CacheModule.register({
      store: redisStore,
      url: 'redis://localhost:6379',
    }),
    TypeOrmModule.forRootAsync(typeOrmModuleOptions),
    AuthModule,
    UserModule,
    TeamMemberModule,
    PlayerModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
