import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chats } from './entities/chats.entity';
import { Repository } from 'typeorm';
import { CreateChatDto } from './dto/create-chat.dto';
import { CommonService } from '../common/common.service';
import { PaginateChatDto } from './dto/paginate-chat.dto';

@Injectable()
export class ChatsService {
    constructor(
        @InjectRepository(Chats)
        private readonly chatsRepository: Repository<Chats>,
        private readonly commonService: CommonService,
    ) {}

    async getAllChats() {
        return await this.chatsRepository.find({
            relations: ['users'],
        });
    }

    async paginateChat(dto: PaginateChatDto, userId: number) {
        const filterOptions = {
            relations: ['users'],
            where: {
                users: {
                    id: userId,
                },
            },
        };

        const chats = await this.commonService.paginate(
            dto,
            this.chatsRepository,
            filterOptions,
            'chats',
        );
        return chats;
    }

    // 채팅방 생성
    async createChat(createChatDto: CreateChatDto) {
        // 팀 생성 시 채팅방 생성
        const chat = await this.chatsRepository.save({
            users: createChatDto.userIds.map((id) => ({ id })),
        });

        return this.chatsRepository.findOne({
            where: { id: chat.id },
        });
    }

    // 채팅방 초대
    async inviteChat(chatId: number, userId: number) {
        return await this.chatsRepository
            .createQueryBuilder('chat')
            .relation('users')
            .of(chatId)
            .add(userId);
    }

    // chatId에 해당하는 채팅방이 존재하는지 확인
    async checkIdChatExists(chatId: number) {
        const exists = await this.chatsRepository.exists({
            where: {
                id: chatId,
            },
        });
        return exists;
    }

    // chatId에 해당하는 채팅방에 userId가 속해있는지 확인
    async checkMember(chatId: number, userId: number) {
        const exists = await this.chatsRepository
            .createQueryBuilder('chat')
            .leftJoin('chat.users', 'users')
            .where('chat.id = :chatId', { chatId })
            .andWhere('users.id = :userId', { userId })
            .getCount();

        return exists;
    }

    // 채팅방 나가기
    async leaveChat(chatId: number, socketId: number) {
        return await this.chatsRepository
            .createQueryBuilder('chat')
            .relation('users')
            .of(chatId)
            .remove(socketId);
    }
}
