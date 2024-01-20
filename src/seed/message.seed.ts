import { DataFactory, Seeder } from 'nestjs-seeder';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../messages/entities/messages.entity';

@Injectable()
export class MessageSeed implements Seeder {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  seed(): Promise<any> {
    const message = DataFactory.createForClass(Message).generate(50);

    return this.messageRepository.insert(message);
  }
  drop(): Promise<any> {
    return this.messageRepository.delete({});
  }
}
