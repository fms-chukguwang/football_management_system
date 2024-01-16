import { Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import { RedisService } from './redis.service';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisModule as NestRedisModule } from 'nestjs-redis';
import * as dotenv from 'dotenv';
dotenv.config();

const cacheModule = CacheModule.register({
  useFactory: async () => ({
    store: redisStore,
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    ttl: 1000,
  }),
});

@Module({
  imports: [CacheModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisCacheModule {}
