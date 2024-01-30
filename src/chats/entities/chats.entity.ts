import { BaseModel } from '../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Entity, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Message } from '../../messages/entities/messages.entity';
import { TeamModel } from '../../team/entities/team.entity';

/**
 * 하나의 팀은 하나의 채팅방을 가질 수 있음. (1:1)
 * 여러명의 유저는 여러개의 채팅방을 가질 수 있음. (N:M)
 */
@Entity('chats')
export class Chats extends BaseModel {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToMany(() => User, (user) => user.chats)
    users: User[];

    @OneToMany(() => Message, (message) => message.chat)
    messages: Message[];

    @OneToOne(() => TeamModel, (team) => team.chat, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    team: TeamModel;
}
