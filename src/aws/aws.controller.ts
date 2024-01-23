import { Controller, Get, Param } from '@nestjs/common';
import { AwsService } from './aws.service';

@Controller()
export class AwsController {
    constructor(private readonly awsService: AwsService) {}

    /**
     * 이미지 url 받기
     * @returns
     */
    @Get('image/:imageUuid')
    async getImageUrl(@Param('imageUuid') imageUuid: string) {
        return await this.awsService.presignedUrl(imageUuid);
    }
}
