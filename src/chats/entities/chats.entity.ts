import { BaseModel } from 'src/common/entities/base.entity';
import { User } from 'src/user/entities/user.entity';
import { Entity, ManyToMany, OneToMany } from 'typeorm';
import { Message } from '../messages/entities/messages.entity';

/**
 * 하나의 팀은 하나의 채팅방을 가질 수 있음. (1:1)
 * 여러명의 유저는 여러개의 채팅방을 가질 수 있음. (N:M)
 */
@Entity('chats')
export class Chats extends BaseModel {
  @ManyToMany(() => User, (user) => user.chats)
  users: User[];

  @OneToMany(() => Message, (message) => message.chat)
  messages: Message[];
}
