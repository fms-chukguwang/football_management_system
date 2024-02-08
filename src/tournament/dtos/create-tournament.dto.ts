import { PickType } from '@nestjs/swagger';
import { TournamentModel } from '../entities/tournament.entity';
import { IsString } from 'class-validator';

export class CreateTournamentDto extends PickType(TournamentModel, [
    'name',
    'teamLimit',
    'registerDeadline',
    'tournamentDate',
]) {
    @IsString()
    address: string;
}
