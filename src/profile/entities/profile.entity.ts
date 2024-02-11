import { Exclude } from 'class-transformer';
import {
    IsDate,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsString,
    IsStrongPassword,
} from 'class-validator';
import { UserStatus } from '../../enums/user-status.enum';
import { Gender } from '../../enums/gender.enum';
import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { User } from '../../user/entities/user.entity';
import { Factory } from 'nestjs-seeder';
import { LocationModel } from '../../location/entities/location.entity';
import { Position } from '../../enums/position.enum';
import { Member } from '../../member/entities/member.entity';

@Entity('profile')
@Index('idx_user_id', ['user'], { unique: true })
@Index('idx_gender', ['gender'], { unique: false })
@Index('idx_location', ['location'], { unique: false })
export class Profile {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * 실력
     * @example 9
     */
    @Column({ nullable: true })
    skillLevel: number;

    /**
     * 몸무게
     * @example 59
     */
    @Column({ nullable: true })
    weight: number;

    /**
     * 키
     * @example 159
     */
    @Column({ nullable: true })
    height: number;

    /**
     * 포지션
     * @example "Attacking Midfielder"
     */
    @IsEnum(Position)
    @Column({
        type: 'enum',
        enum: Position,
        default: Position.AttackingMidfielder,
    })
    preferredPosition: Position;

    /**
     * 사진 url
     * @example "사진url"
     */
    @IsString()
    @Column({ nullable: true })
    imageUrl: string;

    /**
     * 나이
     * @example 18
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
     * 성별
     * @example "Male"
     */
    @IsEnum(Gender)
    @Column({ nullable: false, default: Gender.Female })
    gender: Gender;

    /**
     * 위치
     * @example "Location_id"
     */
    @OneToOne(() => LocationModel, (location) => location.profile, {
        cascade: true,
    })
    @JoinColumn()
    location: LocationModel;

    /**
     * 유저 아이디
     * @example 1
     */
    @OneToOne(() => User, (user) => user.profile)
    @JoinColumn()
    user: User;

    /**
     * 선수 이름
     * @example "김메시"
     */
    // @IsString()
    // @Column()
    // name: string;

    // @BeforeInsert()
    // @BeforeUpdate()
    // async generateUserName() {
    //     if (this.user) {
    //         // Profile에 연결된 User가 존재하면 User의 이름을 가져와서 user_name 속성에 할당
    //         this.name = this.user.name;
    //     }
    // }

    @OneToMany(() => Member, (member) => member.profile)
    @JoinColumn()
    member: Member;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: 'timestamp', nullable: true, default: null })
    deletedAt: Date;

    @Column({
        name: 'image_uuid',
    })
    imageUUID: string;
}
