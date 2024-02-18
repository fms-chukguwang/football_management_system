import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/messages.entity';
import { Repository } from 'typeorm';
import { CreateMessagesDto } from './dto/create-message.dto';
import { PaginateMessageDto } from './dto/paginate-message.dto';
import { CommonService } from '../common/common.service';
import { badWordsList } from '../chats/bad-words/badWordsList.kr';
@Injectable()
export class ChatMessagesService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
        private readonly commonService: CommonService,
    ) {}

    private filterBadWords(message: string): string {
        badWordsList.forEach((badWord) => {
            const regex = new RegExp(`${badWord}`, 'gi');
            message = message.replace(regex, '❤️'.repeat(badWord.length));
        });
        return message;
    }

    async paginateMessages(dto: PaginateMessageDto, chatId: number) {
        return await this.commonService.paginate(
            dto,
            this.messageRepository,
            {
                where: {
                    chat: {
                        id: chatId,
                    },
                },
                relations: ['author'],
            },
            `chats/${chatId}/messages/`,
        );
    }

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
        const filterdMessage = this.filterBadWords(createMessageDto.message);
        const message = await this.messageRepository.save({
            chat: {
                id: createMessageDto.chatId,
            },
            author: {
                id: authorId,
            },
            message: filterdMessage,
        });

        return await this.messageRepository.findOne({
            where: {
                id: message.id,
            },
            relations: ['chat', 'author'],
        });
    }
}
