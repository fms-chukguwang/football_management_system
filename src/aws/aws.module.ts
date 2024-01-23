import { Module } from '@nestjs/common';
import { AwsService } from './aws.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AwsController } from './aws.controller';

@Module({
    exports: [AwsService],
    providers: [AwsService],
    controllers: [AwsController],
})
export class AwsModule {}
