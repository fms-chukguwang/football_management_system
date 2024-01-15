import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/messages.entity';
import { Repository } from 'typeorm';
import { CreateMessagesDto } from './dto/create-message.dto';

@Injectable()
export class ChatMessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async getAllMessages(chatId: number) {
    const message = await this.messageRepository.find({
      where: {
        chat: {
          id: chatId,
        },
      },
      relations: ['author'],
    });
    const willDeleteOptions = [
      'password',
      'refreshToken',
      'createdAt',
      'updatedAt',
      'phone',
      'birthdate',
      'status',
      'kakaoId',
      'googleId',
      'appleId',
      'role',
    ];
    message.forEach((message) => {
      willDeleteOptions.forEach((option) => {
        delete message.author[option];
      });
    });
    return message;
  }

  async createMessage(createMessageDto: CreateMessagesDto, authorId: number) {
    const message = await this.messageRepository.save({
      chat: {
        id: createMessageDto.chatId,
      },
      author: {
        id: authorId,
      },
      message: createMessageDto.message,
    });

    return await this.messageRepository.findOne({
      where: {
        id: message.id,
      },
      relations: ['chat', 'author'],
    });
  }
}
