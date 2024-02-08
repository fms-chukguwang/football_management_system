import { PartialType, PickType } from '@nestjs/swagger';
import { TournamentModel } from '../entities/tournament.entity';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTournamentDto extends PartialType(TournamentModel) {
    @IsString()
    @IsOptional()
    name?: string;

    @IsNumber()
    @IsOptional()
    teamLimit?: number;

    @IsDate()
    @IsOptional()
    registerDeadline?: Date;

    @IsDate()
    @IsOptional()
    tournamentDate?: Date;

    @IsString()
    @IsOptional()
    address?: string;
}
