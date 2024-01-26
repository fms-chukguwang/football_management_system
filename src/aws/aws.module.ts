import { Module } from '@nestjs/common';
import { AwsController } from './aws.controller';
import { AwsService } from './aws.service';

@Module({
    exports: [AwsService],
    providers: [AwsService],
    controllers: [AwsController],
})
export class AwsModule {}
