import { Exclude } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { UserStatus } from '../../enums/user-status.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../types/user-role.type';
import { Factory } from 'nestjs-seeder';
import { hashPassword } from '../../helpers/password.helper';
import { Inject } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { Chats } from 'src/chats/entities/chats.entity';
import { Message } from 'src/chats/messages/entities/messages.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Inject()
  private readonly redisService: RedisService;


  /**
   * 이메일
   * @example "example@example.com"
   */
  @Factory((faker) => faker.internet.email())
  @IsNotEmpty({ message: '이메일을 입력해 주세요.' })
  @IsEmail({}, { message: '이메일 형식에 맞지 않습니다.' })
  @Column({ unique: true })
  email: string;

  /**
   * 비밀번호
   * @example "Ex@mp1e!!"
   */
  @Factory((faker) => hashPassword('Ex@mp1e!!'))
  @IsNotEmpty({ message: '비밀번호을 입력해 주세요.' })
  @IsStrongPassword(
    {},
    {
      message:
        '비밀번호는 영문 알파벳 대,소문자, 숫자, 특수문자(!@#$%^&*)를 포함해서 8자리 이상으로 입력해야 합니다.',
    },
  )
  @Column({ select: false })
  password: string;

  /**
   * 이름
   * @example "홍길동"
   */
  @Factory((faker) => faker.person.fullName())
  @IsNotEmpty({ message: '이름을 입력해 주세요.' })
  @IsString()
  @Column()
  name: string;

  /**
   * 역할
   * @example "User"
   */

  @IsEnum(UserRole)
  @Column({ type: 'enum', enum: UserRole, default: UserRole.User })
  role: UserRole;

  @Column({ nullable: true }) 
  refreshToken: string;

  // async saveRefreshTokenToRedis() {
  //   const client = await this.redisService.getClient();
  //   await client.set(`refreshToken:${this.id}`, this.refreshToken);
  // }

  // async getRefreshTokenFromRedis() {
  //   const client = await this.redisService.getClient();
  //   return client.get(`refreshToken:${this.id}`);
  // }

  /**
   * 상태
   * @example "Active"
   */
  @IsEnum(UserStatus)
  @Column({ default: 'Active' })
  status: UserStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  deletedAt: Date;

  @ManyToMany(() => Chats, (chat) => chat.users)
  @JoinTable()
  chats: Chats[];

  @OneToMany(() => Message, (message) => message.author)
  messages: Message[];
}
