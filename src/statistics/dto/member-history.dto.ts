import { ApiHideProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class MemberHistoryDto {
    teamId: number;

    teamName: string;

    @Type(() => Date)
    joinDate: Date;

    @Type(() => Date)
    @Transform(({ value }) => (value ? new Date(value) : null))
    deletedAt: Date | null;

    @Transform(({ value }) => parseInt(value))
    totalGames: number;

    @Transform(({ value }) => parseInt(value))
    totalGoals: number;

    @Transform(({ value }) => parseInt(value))
    totalAssists: number;

    @Transform(({ value }) => parseInt(value))
    totalPoint: number;

    @Transform(({ value }) => parseInt(value))
    totalSave: number;

    @Transform(({ value }) => parseInt(value))
    totalCleanSheet: number;
}
