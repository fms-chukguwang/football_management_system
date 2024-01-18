import { Module } from '@nestjs/common';
import { AwsService } from './aws.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Module({
    exports: [AwsService],
    providers: [AwsService],
})
export class AwsModule {}
