import { Module } from '@nestjs/common';
import { AwsController } from './aws.controller';
import { AwsService } from './aws.service';
import { RedisService } from '../redis/redis.service';
import { RedisModule } from '../redis/redis.module';
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Module({
    imports: [RedisModule],
    exports: [AwsService],
    providers: [
        AwsService,
        {
            provide: S3Client,
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                return new S3Client({
                    region: configService.get('AWS_REGION'),
                    credentials: {
                        accessKeyId: configService.get('AWS_ACCESS_KEY'),
                        secretAccessKey: configService.get('AWS_SECRET_KEY'),
                    },
                });
            },
        },
    ],
    controllers: [AwsController],
})
export class AwsModule {}
