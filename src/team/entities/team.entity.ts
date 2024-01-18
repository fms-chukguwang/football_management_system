import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
} from 'typeorm';
import { IsBoolean, IsEnum, IsString } from 'class-validator';
import { stringValidationMessage } from '../validation-message/string-validation.message';
import { BaseModel } from 'src/common/entities/base.entity';
import { LocationModel } from '../../location/entities/location.entity';
import { User } from 'src/user/entities/user.entity';
import { Gender } from 'src/enums/gender.enum';
import { Transform } from 'class-transformer';
import { Member } from 'src/member/entities/member.entity';

@Entity('team')
export class TeamModel extends BaseModel {
    /**
     * 팀명
     * @example '태풍fc'
     */
    @Column({
        unique: true,
    })
    @IsString({
        message: stringValidationMessage,
    })
    name: string;

    /**
     * 팀 설명
     * @example '수원시 권선구에서 활동하는 태풍FC입니다.'
     */
    @Column()
    @IsString({
        message: stringValidationMessage,
    })
    description: string;

    /**
     * 팀 로고 url
     */
    @Column({
        name: 'logo_url',
    })
    logoUrl: string;

    /**
     * 혼성 여부
     */
    @Column({
        name: 'is_mixed_gender',
    })
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    isMixedGender: boolean;

    /**
     * 팀 성별
     */
    @IsEnum(Gender)
    @Column({ type: 'enum', enum: Gender })
    gender: Gender;

    /**
     * 팀 구장
     */
    @ManyToOne(() => LocationModel, (location) => location.team, {
        cascade: true,
    })
    @JoinColumn()
    location: LocationModel;

    /**
     * 팀 생성자
     */
    @OneToOne(() => User, (user) => user.team)
    @JoinColumn()
    creator: User;

    @OneToMany(() => Member, (member) => member.team)
    members: Member[];
}
