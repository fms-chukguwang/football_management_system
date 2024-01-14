import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chats } from './entities/chats.entity';
import { Repository } from 'typeorm';
import { CreateChatDto } from './dto/create-chat.dto';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chats)
    private readonly chatsRepository: Repository<Chats>,
  ) {}

  async getAllChats() {
    return await this.chatsRepository.find({
      relations: ['users'],
    });
  }

  // 채팅방 생성
  async createChat(createChatDto: CreateChatDto) {
    const chat = await this.chatsRepository.save({
      users: createChatDto.userIds.map((id) => ({ id })),
    });

    return this.chatsRepository.findOne({
      where: { id: chat.id },
    });
  }

  async checkIdChatExists(chatId: number) {
    const exists = await this.chatsRepository.exists({
      where: {
        id: chatId,
      },
    });
    return exists;
  }
}
