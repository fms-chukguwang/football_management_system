import {
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
    HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 } from 'uuid';

@Injectable()
export class AwsService {
    private readonly awsS3: S3Client;

    constructor(private readonly configService: ConfigService) {
        this.awsS3 = new S3Client({
            region: this.configService.get('AWS_REGION'),
            credentials: {
                accessKeyId: this.configService.get('AWS_ACCESS_KEY'),
                secretAccessKey: this.configService.get('AWS_SECRET_KEY'),
            },
        });
    }

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
        const presingedUrl = await getSignedUrl(this.awsS3, getCommend, { expiresIn: 300 });

        return presingedUrl;
    }
}
