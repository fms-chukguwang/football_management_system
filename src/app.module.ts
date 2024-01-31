import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configModuleValidationSchema } from './configs/env-validation.config';
import { typeOrmModuleOptions } from './configs/database.config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { RedisModule } from './redis/redis.module';
import { AppService } from './app.service';
import { ChatsModule } from './chats/chats.module';
import { CommonModule } from './common/common.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggingModule } from './logging/logging.module';
import * as mongoose from 'mongoose';
import { LoggingService } from './logging/logging.service';
import { MatchModule } from './match/match.module';
import { AdminModule } from './admin/admin.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LogInterceptor } from './common/interceptors/log.interceptor';
import { ProfileController } from './profile/profile.controller';
import { ProfileService } from './profile/profile.service';
import { ProfileModule } from './profile/profile.module';
import { TeamModule } from './team/team.module';
import { LocationModel } from './location/entities/location.entity';
import { MemberModule } from './member/member.module';
import { TaskModule } from './task/task.module';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsModule } from './jobs/jobs.module';
import { WebhookInterceptor } from './common/interceptors/webhook.interceptor';
import { FormationModule } from './formation/formation.module';
import { RavenInterceptor, RavenModule } from 'nest-raven';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: configModuleValidationSchema,
        }),
        TypeOrmModule.forRootAsync(typeOrmModuleOptions),
        MongooseModule.forRoot(process.env.MONGO_URI),
        AuthModule,
        UserModule,
        MatchModule,
        RedisModule,
        ChatsModule,
        CommonModule,
        LoggingModule,
        AdminModule,
        ProfileModule,
        TeamModule,
        LocationModel,
        MemberModule,
        TaskModule,
        ScheduleModule.forRoot(),
        JobsModule,
        FormationModule,
        RavenModule,
        StatisticsModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_INTERCEPTOR,
            useClass: LogInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: WebhookInterceptor,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: SentryInterceptor,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
        mongoose.set('debug', true);
    }
}
