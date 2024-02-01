import { ApiHideProperty } from '@nestjs/swagger';

export class TopPlayerDto {
    @ApiHideProperty()
    topGoals: Array<{
        teamId: number;
        memberId: number;
        userName: string;
        totalGoals: number;
        image: string;
    }>;

    @ApiHideProperty()
    topAssists: Array<{
        teamId: number;
        memberId: number;
        userName: string;
        totalAssists: number;
        image: string;
    }>;

    @ApiHideProperty()
    topJoining: Array<{
        teamId: number;
        memberId: number;
        userName: string;
        joining: number;
        image: string;
    }>;

    @ApiHideProperty()
    topSave: Array<{
        teamId: number;
        memberId: number;
        userName: string;
        totalSave: number;
        image: string;
    }>;

    @ApiHideProperty()
    topAttactPoint: Array<{
        teamId: number;
        memberId: number;
        userName: string;
        attactPoint: number;
        image: string;
    }>;
}
