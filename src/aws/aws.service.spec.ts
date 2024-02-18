import { ConfigService } from '@nestjs/config';
import { AwsService } from './aws.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from 'src/redis/redis.service';
import { v4 as uuidv4 } from 'uuid';
jest.mock('uuid', () => {
    return {
        v4: jest.fn(() => 'uuid'),
    };
});

describe('AwsService', () => {
    let service: AwsService;
    let configService: ConfigService;
    let redisService: RedisService;
    let awsS3: S3Client;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AwsService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key) => {
                            if (key === 'AWS_BUCKET_NAME') {
                                return 'aws-bucket-name';
                            }
                        }),
                    },
                },
                {
                    provide: RedisService,
                    useValue: {
                        getPresignedUrl: jest.fn(),
                    },
                },
                {
                    provide: S3Client,
                    useValue: {
                        send: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AwsService>(AwsService);
        configService = module.get<ConfigService>(ConfigService);
        redisService = module.get<RedisService>(RedisService);
        awsS3 = module.get<S3Client>(S3Client);
    });

    function MockFile() {}

    MockFile.prototype.create = function (name, size, mimeType) {
        name = name || 'mock.txt';
        size = size || 1024;
        mimeType = mimeType || 'plain/txt';

        function range(count) {
            var output = '';
            for (var i = 0; i < count; i++) {
                output += 'a';
            }
            return output;
        }

        var blob = new Blob([range(size)], { type: mimeType });

        return blob;
    };

    it('uploadFile 테스트', async () => {
        const mockFile = new MockFile();
        const file = mockFile.create('mock.txt', 1024, 'plain/txt');
        const result = await service.uploadFile(file);

        console.log('result', result);
    });
});
