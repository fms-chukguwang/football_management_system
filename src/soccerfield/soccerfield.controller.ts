import { Controller, Get, Param, UseGuards, Request, Query } from '@nestjs/common';
import { SoccerfieldService } from './soccerfield.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginateFieldDto } from './dtos/paginate-field-dto';

@Controller('soccerfield')
export class SoccerfieldController {
    constructor(private readonly soccerfieldService: SoccerfieldService) {}

    /**
     * 경기장 전체 조회
     * @param req
     * @returns
     */
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('page')
    async findAllStadium(@Request() req, @Query() dto: PaginateFieldDto) {
        const userId = req.user.id;

        const data = await this.soccerfieldService.findAllStadium(userId, dto, dto.name);

        return data;
    }

    @Get(':soccer_field_id')
    async findOneStadium(@Param('soccer_field_id') soccer_field_id: number) {
        const data = await this.soccerfieldService.findOneStadium(soccer_field_id);
        console.log('data', data);
        return data;
    }
}
