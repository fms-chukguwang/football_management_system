import { ApiHideProperty } from '@nestjs/swagger';

export class PlayersDto {
    @ApiHideProperty()
    players: Array<{
        memberId: number;
        userName: string;
        image: string | null;
        totalGames: number;
        totalGoals: number;
        totalAssists: number;
        attactPoint: number;
        totalYellowCards: number;
        totalRedCards: number;
        totalÇleanSheet: number;
        totalSave: number;
    }>;
}
