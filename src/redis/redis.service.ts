import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';

@Injectable()
export class RedisService {
    private readonly redisClient: IORedis;
    private readonly refreshTokenTTL: number = 1 * 24 * 60 * 60; // 하루
    private readonly kakaoCodeTTL: number = 1 * 60 * 3; // 3분
    constructor(private readonly configService: ConfigService) {
        this.redisClient = new IORedis({
            host: this.configService.get<string>('REDIS_HOST'),
            port: this.configService.get<number>('REDIS_PORT'),
        });
        this.redisClient.on('connect', () => {
            console.log('Connected to Redis');
        });
        this.redisClient.on('error', (err) => {
            console.error('Redis connection error:', err);
        });
    }

    async kakaoCode(userId: number, kakaoCode: number): Promise<void> {
        const key = `kakaoCode:${kakaoCode}`;
        await this.redisClient.set(key, userId);
        console.log('redis KakaoCode called=', await this.redisClient.get(key));
        await this.redisClient.expire(key, this.kakaoCodeTTL);
        console.log('redis kakaoCode expires in = ', this.kakaoCodeTTL);
    }


    async setRefreshToken(userId: number, refreshToken: string): Promise<void> {
        await this.redisClient.set(`refreshToken:${userId}`, refreshToken);
        await this.redisClient.expire(`refreshToken:${userId}`, this.refreshTokenTTL);
    }

    async getUserId(kakaoCode: number): Promise<any | null> {
        const key = `kakaoCode:${kakaoCode}`;
        const redisValue = await this.redisClient.get(key);
        console.log('Redis value =', redisValue);
        console.log('typeof redisValue=', typeof redisValue);
        return redisValue;
    }

    async getRefreshToken(userId: number): Promise<string | null> {
        return await this.redisClient.get(`refreshToken:${userId}`);
    }
    async deleteRefreshToken(userId: number): Promise<void> {
        await this.redisClient.del(`refreshToken:${userId}`);
    }
}
