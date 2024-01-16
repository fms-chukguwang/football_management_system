import { Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { RedisService } from './redis.service';
import { RedisService as NestRedisService } from 'nestjs-redis'; 

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: () => ({
        store: redisStore,
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        ttl: 10000,
      }),
    } as CacheModuleOptions),
  ],
  providers: [
    RedisService,
    NestRedisService, 
  ],
  exports: [RedisService,  NestRedisService],
 // exports: [RedisModule],//어차피 클래스에서 익스포트하니까 여기서 또 모듈 익스포트 안해줘도됨
})
export class RedisModule {}
