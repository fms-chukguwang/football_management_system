import { ApiHideProperty } from '@nestjs/swagger';

export class TopPlayerDto {
    @ApiHideProperty()
    topGoals: Array<{
        teamId: number;
        memberId: number;
        userName: string;
        totalGoals: number;
    }>;

    @ApiHideProperty()
    topAssists: Array<{
        teamId: number;
        memberId: number;
        userName: string;
        totalAssists: number;
    }>;

    @ApiHideProperty()
    topJoining: Array<{
        teamId: number;
        memberId: number;
        userName: string;
        joining: number;
    }>;

    @ApiHideProperty()
    topSave: Array<{
        teamId: number;
        memberId: number;
        userName: string;
        totalSave: number;
    }>;

    @ApiHideProperty()
    topAttactPoint: Array<{
        teamId: number;
        memberId: number;
        userName: string;
        attactPoint: number;
    }>;
}
