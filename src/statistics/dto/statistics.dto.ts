export class StatisticsDto {
    wins: number;
    loses: number;
    draws: number;
    totalGames: number;
    goals: number;
    conceded: number;
    cleanSheet: number;
    assists: number;
    otherTeam: {
        totalGoals: number;
        totalAssists: number;
        totalCleanSheet: number;
    };
}
