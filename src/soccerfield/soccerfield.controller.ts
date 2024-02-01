import { Controller, Get, Param } from '@nestjs/common';
import { SoccerfieldService } from './soccerfield.service';

@Controller('soccerfield')
export class SoccerfieldController {
    constructor(private readonly soccerfieldService: SoccerfieldService) {}

    @Get(':soccer_field_id')
    async findOneStadium(@Param('soccer_field_id') soccer_field_id: number) {
        const data = await this.soccerfieldService.findOneStadium(soccer_field_id);
        console.log('data', data);
        return data;
    }
}
