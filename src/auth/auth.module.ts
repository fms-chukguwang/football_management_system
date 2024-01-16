import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { LocalStrategy } from './strategies/local.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { UserService } from '../user/user.service';
import { EmailModule } from '../email/email.module';
import { JwtKakaoStrategy } from './strategies/jwt-social-kakao.strategy';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisModule } from 'nestjs-redis';


@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '12h',
        },
      }),
    }),
    CacheModule.register({
      store: redisStore,
      url: 'redis://localhost:6379',
    }),
    RedisModule, // 여기에 RedisModule 포함
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtKakaoStrategy,
    UserService, 
    
  ],
  exports: [TypeOrmModule.forFeature([User]), RedisModule], // RedisModule 내보내기
})
export class AuthModule {}
