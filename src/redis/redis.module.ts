import { CacheModule, Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import * as dotenv from 'dotenv';
import { RedisCacheService } from './redis.service';
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
  imports: [cacheModule],
  providers:[RedisCacheService],
  exports: [RedisCacheService],
})
export class RedisCacheModule {}