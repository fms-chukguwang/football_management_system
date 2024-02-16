import { Module } from '@nestjs/common';
import { AwsController } from './aws.controller';
import { AwsService } from './aws.service';
import { RedisService } from '../redis/redis.service';
import { RedisModule } from '../redis/redis.module';

@Module({
    imports: [RedisModule],
    exports: [AwsService],
    providers: [AwsService],
    controllers: [AwsController],
})
export class AwsModule {}
