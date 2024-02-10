import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { ChatsGateway } from './chats.gateway';
import { Chats } from './entities/chats.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../messages/entities/messages.entity';
import { ChatMessagesService } from '../messages/messages.service';
import { MessagesController } from '../messages/messages.controller';
import { CommonModule } from '../common/common.module';
import { UserModule } from 'src/user/user.module';

@Module({
    exports: [ChatsService],
    imports: [TypeOrmModule.forFeature([Chats, Message]), CommonModule, UserModule],
    controllers: [ChatsController, MessagesController],
    providers: [ChatsService, ChatsGateway, ChatMessagesService],
})
export class ChatsModule {}
