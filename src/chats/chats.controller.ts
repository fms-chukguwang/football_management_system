import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { PaginateChatDto } from './dto/paginate-chat.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  // @Get()
  // async getAllChats() {
  //   return await this.chatsService.getAllChats();
  // }
  @Get()
  async paginateChat(@Query() dto: PaginateChatDto, @Req() req) {
    return await this.chatsService.paginateChat(dto, req.user.id);
  }

  @Get(':userId')
  paginateChatById() {}
}
