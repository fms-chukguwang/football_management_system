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
    JoinColumn,
    JoinTable,
    ManyToMany,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../types/user-role.type';
import { Factory } from 'nestjs-seeder';
import { hashPassword } from '../../helpers/password.helper';
import { TeamModel } from 'src/team/entities/team.entity';
import { Member } from 'src/member/entities/member.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

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
     * 닉네임
     * @example "홍길동"
     */
    @Factory((faker) => faker.person.firstName())
    @IsNotEmpty({ message: '이름을 입력해 주세요.' })
    @IsString()
    @Column()
    name: string;

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
     * 역할
     * @example "Collaborator"
     */

    @IsEnum(UserRole)
    @Column({ type: 'enum', enum: UserRole, default: UserRole.User })
    role: UserRole;

    /**
     * 상태
     * @example "Active"
     */
    @IsEnum(UserStatus)
    @Column({ default: 'Active' })
    status: UserStatus;

    @Column({ nullable: true })
    refreshToken: string;

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

    @OneToOne(() => TeamModel, (team) => team.creator, {
        cascade: true,
    })
    team: TeamModel;

    @OneToOne(() => Member, (member) => member.user)
    member: Member;
}
