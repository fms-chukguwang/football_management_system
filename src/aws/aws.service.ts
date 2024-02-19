import {
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
    HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { v4 } from 'uuid';

@Injectable()
export class AwsService {
    constructor(
        private readonly configService: ConfigService,
        private readonly redisService: RedisService,
        private readonly awsS3: S3Client,
    ) {}

    /**
     * s3 이미지 업로드
     * @param file
     */
    async uploadFile(file: Express.Multer.File) {
        const uuid = v4();
        const uploadCommend = new PutObjectCommand({
            Bucket: this.configService.get('AWS_BUCKET_NAME'),
            Key: uuid,
            Body: file.buffer,
            //ACL: 'public-read',
            ContentType: file.mimetype,
        });

        await this.awsS3.send(uploadCommend);

        return uuid;
    }

    /**
     * presigned url 발급하기
     * @param key
     * @returns
     */
    async presignedUrl(key: string) {
        const getPresignedUrlForRedis = await this.redisService.getPresignedUrl(key);

        if (!getPresignedUrlForRedis) {
            try {
                const command = new HeadObjectCommand({
                    Bucket: this.configService.get('AWS_BUCKET_NAME'),
                    Key: key,
                });

                await this.awsS3.send(command);
            } catch (err) {
                throw new NotFoundException('이미지가 존재하지 않습니다.');
            }

            const getCommend = new GetObjectCommand({
                Bucket: this.configService.get('AWS_BUCKET_NAME'),
                Key: key,
            });
            const presingedUrl = await getSignedUrl(this.awsS3, getCommend, { expiresIn: 180 });
            await this.redisService.setPresignedUrl(key, presingedUrl);

            return presingedUrl;
        }

        console.log('기존 url', getPresignedUrlForRedis);

        return getPresignedUrlForRedis;
    }
}
