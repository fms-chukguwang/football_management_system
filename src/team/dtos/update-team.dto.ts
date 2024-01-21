import { PartialType } from '@nestjs/swagger';
import { TeamModel } from '../entities/team.entity';

export class UpdateTeamDto extends PartialType(TeamModel) {}
