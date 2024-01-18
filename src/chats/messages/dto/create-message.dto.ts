import { PickType } from '@nestjs/swagger';
import { Message } from '../entities/messages.entity';
import { IsNumber } from 'class-validator';

export class CreateMessagesDto extends PickType(Message, ['message']) {
  @IsNumber()
  chatId: number;
}
