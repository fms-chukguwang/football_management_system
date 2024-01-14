import { Exclude } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { UserStatus } from '../../user/types/user-status.type';
import { Gender } from '../../enums/gender.enum';
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
import { Factory } from 'nestjs-seeder';
import { hashPassword } from '../../helpers/password.helper';
import { MemberRole } from 'src/enums/member-role.enum';

@Entity('managers')
export class Manager {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 팀 이름
   * @example "맨유"
   */

  /**
   * 유저 아이디
   * @example "1"
   */

  /**
   * 감독 이름
   * @example "알렉스 퍼거슨"
   */

  @IsString()
  @Column({ nullable: true })
  name: string;

  /**
   * 사진 url
   * @example "사진url"
   */
  @IsString()
  @Column({ nullable: true })
  imageUrl: string;

  /**
   * 나이
   * @example "18"
   */
  @Column({ nullable: true })
  age: number;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  deletedAt: Date;
}
