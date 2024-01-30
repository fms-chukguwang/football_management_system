import { IsNumber } from 'class-validator';

export class EnterChatDto {
    @IsNumber()
    teamId: number;
}
