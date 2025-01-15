import { IsNumber } from 'class-validator';
import { TeamModel } from '../../team/entities/team.entity';

export class CreateChatDto {
    @IsNumber({}, { each: true })
    userIds: number[];
}
