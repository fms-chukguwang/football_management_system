import { IsNumber } from 'class-validator';
import { TeamModel } from '../../team/entities/team.entity';

export class CreateChatDto {
    // @IsNumber()
    // teamId: number;

    @IsNumber({}, { each: true })
    userIds: number[];
}
