import { Module } from '@nestjs/common';
import { AwsController } from './aws.controller';
import { AwsService } from './aws.service';
import { RedisService } from 'src/redis/redis.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
    imports: [RedisModule],
    exports: [AwsService],
    providers: [AwsService],
    controllers: [AwsController],
})
export class AwsModule {}
