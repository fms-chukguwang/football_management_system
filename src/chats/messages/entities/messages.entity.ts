import { IsString } from 'class-validator';
import { Chats } from 'src/chats/entities/chats.entity';
import { BaseModel } from 'src/common/entities/base.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity('messages')
export class Message extends BaseModel {
  // 어떤 채팅방에서 작성된 것인지
  // 여러개의 메세지가 하나의 채팅방에 속함 (N:1)
  @ManyToOne(() => Chats, (chat) => chat.messages)
  chat: Chats;

  // 채팅을 누가 썼는지
  // 여러개의 채팅을 하나의 유저가 쓸 수 있음. (N:1)
  @ManyToOne(() => User, (user) => user.messages, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  author: User;

  @Column()
  @IsString()
  message: string;
}
