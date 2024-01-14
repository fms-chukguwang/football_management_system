import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisClient } from './interfaces/redis-client.interface';

@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
