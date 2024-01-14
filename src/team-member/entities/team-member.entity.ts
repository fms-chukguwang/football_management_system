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
import { Gender } from '../../enums/gender.enum';
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
import { MemberRole } from 'src/user/types/member-role.type';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 팀 이름
   * @example "맨유"
   */

  /**
   * 휴대폰 번호
   * @example "010-000-0000"
   */

  @IsString()
  @Column({ nullable: true })
  phone: string;

  /**
   * 생년월일
   * @example "7001010"
   */
  @IsDate()
  @Column({ nullable: true })
  birthdate: Date;

  /**
   * 팀내 역할
   * @example "Manager"
   */

  @IsEnum(MemberRole)
  @Column({ type: 'enum', enum: MemberRole })
  role: MemberRole;

  /**
   * 성별
   * @example "Male"
   */
  @IsEnum(Gender)
  @Column({ nullable: false })
  gender: Gender;

  /**
   * 위치
   * @example "Location_id"
   */

  @Column({ nullable: true })
  kakaoId: string;

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true })
  appleId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  deletedAt: Date;
}
