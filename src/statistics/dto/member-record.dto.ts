import { Transform, Type } from 'class-transformer';

export class MemberRecordDto {
    @Transform(({ value }) => parseInt(value))
    matchId: number;

    @Transform(({ value }) => parseInt(value))
    memberId: number;

    @Transform(({ value }) => parseInt(value))
    goals: number;

    @Transform(({ value }) => parseInt(value))
    assists: number;

    @Transform(({ value }) => parseInt(value))
    point: number;

    @Transform(({ value }) => parseInt(value))
    save: number;

    @Transform(({ value }) => parseInt(value))
    cleanSheet: number;

    @Type(() => Date)
    matchDate: Date;

    matchTime: string;

    opposingTeamName: string;
}
