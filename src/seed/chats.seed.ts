import { DataFactory, Seeder } from 'nestjs-seeder';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chats } from '../chats/entities/chats.entity';

@Injectable()
export class ChatsSeed implements Seeder {
  constructor(
    @InjectRepository(Chats)
    private chatsRepository: Repository<Chats>,
  ) {}

  seed(): Promise<any> {
    const chats = DataFactory.createForClass(Chats).generate(50);

    return this.chatsRepository.insert(chats);
  }
  drop(): Promise<any> {
    return this.chatsRepository.delete({});
  }
}
