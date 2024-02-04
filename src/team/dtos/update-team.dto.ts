import { PartialType, OmitType } from '@nestjs/swagger';
import { TeamModel } from '../entities/team.entity';
import { LocationModel } from '../../location/entities/location.entity'; // Import the LocationModel
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';


export class UpdateTeamDto extends PartialType(OmitType(TeamModel, ['location'])) {
    latitude: number;
    longitude: number;
    imageUrl?: string;
    location: LocationModel;
}
