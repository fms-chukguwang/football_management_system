import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { IsBoolean, IsEnum, IsString } from 'class-validator';
import { stringValidationMessage } from '../validation-message/string-validation.message';
import { BaseModel } from '../../common/entities/base.entity';
import { LocationModel } from '../../location/entities/location.entity';
import { User } from '../../user/entities/user.entity';
import { Gender } from '../../enums/gender.enum';
import { Transform } from 'class-transformer';
import { Member } from '../../member/entities/member.entity';
import { Factory } from 'nestjs-seeder';
import { Match } from 'src/match/entities/match.entity';

@Entity('team')
export class TeamModel extends BaseModel {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * 팀명
     * @example '태풍fc'
     */
    @Factory((faker) => faker.lorem.words(3))
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
    @Factory((faker) => faker.lorem.paragraph())
    @Column()
    @IsString({
        message: stringValidationMessage,
    })
    description: string;

    /**
     * 팀 로고 url
     */
    @Factory((faker) => faker.lorem.words(1))
    @Column({
        name: 'image_uuid',
    })
    imageUUID: string;

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
    @Column({ default: 'Mixed' })
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

    @OneToMany(() => Match, (match) => match.hometeam)
    homeMatch: Match[];

    @OneToMany(() => Match, (match) => match.awayteam)
    awayMatch: Match[];
}
