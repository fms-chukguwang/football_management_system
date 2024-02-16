import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';
import { StatisticsDto } from 'src/statistics/dto/statistics.dto';
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

    /**
     * 팀 스탯 가져오기
     */
    async getTeamStats(teamId: number) {
        const result = await this.redisClient.get(`teamStats_${teamId}`);
        console.log('redis result =>>>>>>>>>>>', result);
        return result;
    }

    /**
     * 팀 스탯 저장
     * @param teamStats
     * @param teamId
     */
    async setTeamStats(teamStats: string, teamId: number) {
        await this.redisClient.set(`teamStats_${teamId}`, teamStats);
        await this.redisClient.expire(`teamStats_${teamId}`, 3600);
    }

    /**
     * 팀 탑 플레이어 가져오기
     * @param teamId
     * @returns
     */
    async getTeamTopPlayer(teamId: number) {
        return await this.redisClient.get(`teamTopPlayer_${teamId}`);
    }

    /**
     * 팀 탑 플레이어 저장
     * @param teamTopPlayer
     * @param teamId
     */
    async setTeamTopPlayer(teamTopPlayer: string, teamId: number) {
        await this.redisClient.set(`teamTopPlayer_${teamId}`, teamTopPlayer);
        await this.redisClient.expire(`teamTopPlayer_${teamId}`, 3600);
    }

    /**
     * 팀 플레이어 목록 가져오기
     * @param teamId
     * @returns
     */
    async getTeamPlayers(teamId: number) {
        return await this.redisClient.get(`teamPlayers_${teamId}`);
    }

    /**
     * 팀 플레이어 목록 저장
     * @param teamPlayers
     * @param teamId
     */
    async setTeamPlayers(teamPlayers: string, teamId: number) {
        await this.redisClient.set(`teamPlayers_${teamId}`, teamPlayers);
        await this.redisClient.expire(`teamPlayers_${teamId}`, 3600);
    }

    /**
     * 카드 수정정보 가져오기
     * @param teamId
     * @returns
     */
    async getTeamYellowAndRedCards(teamId: number) {
        return await this.redisClient.get(`temaYellowAndRedCards_${teamId}`);
    }

    /**
     * 카드 수집정보 세팅하기
     * @param yellowAndRedCards
     * @param teamId
     */
    async setTeamYellowAndRedCards(yellowAndRedCards: string, teamId: number) {
        await this.redisClient.set(`temaYellowAndRedCards_${teamId}`, yellowAndRedCards);
        await this.redisClient.expire(`temaYellowAndRedCards_${teamId}`, 3600);
    }

    /**
     * 팀 스탯정보 캐싱 삭제하기
     * @param teamId
     */
    async delTeamStats(teamId: number) {
        await this.redisClient.del(`teamStats_${teamId}`);
        await this.redisClient.del(`teamTopPlayer_${teamId}`);
        await this.redisClient.del(`temaYellowAndRedCards_${teamId}`);
        await this.redisClient.del(`teamPlayers_${teamId}`);
    }
}
