import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';
import { v4 } from 'uuid';

@Injectable()
export class RedisService {
    private readonly redisClient: IORedis;
    private readonly refreshTokenTTL: number = 1 * 24 * 60 * 60; // 하루
    private readonly kakaoCodeTTL: number = 1 * 60 * 3; // 3분
    constructor(private readonly configService: ConfigService) {
        this.redisClient = new IORedis({
            host: this.configService.get<string>('REDIS_HOST'),
            port: this.configService.get<number>('REDIS_PORT'),
            password: this.configService.get<string>('REDIS_PASSWORD'),
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

    /**
     * 팀 참가 이메일 구분 토큰 저장
     * @returns
     */
    async setTeamJoinMailToken(randomToken: string) {
        await this.redisClient.set(randomToken, randomToken);
        await this.redisClient.expire(randomToken, 300);
    }

    /**
     * 팀 참가 이메일 구분 토큰 조회
     * @returns
     */
    async getTeamJoinMailToken(token: string) {
        return await this.redisClient.get(token);
    }

    /**
     * 팀 참가 이메일 구분 토큰 삭제
     * @param token
     */
    async deleteTeamJoinMailToken(token: string) {
        await this.redisClient.del(token);
    }

    /**
     * 팀 정보
     * @param teamId
     * @returns
     */
    async getTeamDetail(teamId: number) {
        return await this.redisClient.get(`teamDeatail_${teamId}`);
    }

    /**
     * 팀 정보 세팅
     * @param team
     * @param teamId
     */
    async setTeamDetail(team: string, teamId: number) {
        await this.redisClient.set(`teamDeatail_${teamId}`, team);
        await this.redisClient.expire(`teamDeatail_${teamId}`, 180);
    }

    /**
     * 팀 정보 삭제
     * @param teamId
     */
    async delTeamDetail(teamId: number) {
        await this.redisClient.del(`teamDeatail_${teamId}`);
    }

    async getPresignedUrl(uuid: string) {
        return await this.redisClient.get(`imageUuid_${uuid}`);
    }

    async setPresignedUrl(uuid: string, imageUrl: string) {
        await this.redisClient.set(`imageUuid_${uuid}`, imageUrl);
        await this.redisClient.expire(`imageUuid_${uuid}`, 180);
    }
}
