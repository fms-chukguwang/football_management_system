import { ApiHideProperty } from '@nestjs/swagger';

export class YellowAndRedCardsDto {
    @ApiHideProperty()
    yellowAndRedCards: Array<{
        yellow: number;
        red: number;
        date: Date;
    }>;
}
