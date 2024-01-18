import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
        const command = new PutObjectCommand({
            Bucket: this.configService.get('AWS_BUCKET_NAME'),
            Key: file.originalname,
            Body: file.buffer,
            //ACL: 'public-read',
            ContentType: `image/${file.mimetype}`,
        });

        const result = await this.awsS3.send(command);

        console.log('업로드 결과', result);

        return `https://s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${this.configService.get('AWS_BUCKET_NAME')}/${file.originalname}`;
    }
}
