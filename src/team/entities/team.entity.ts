import {
    Column,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToMany,
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
import { Match } from '../../match/entities/match.entity';
import { Chats } from '../../chats/entities/chats.entity';
import { MatchFormation } from '../../formation/entities/formation.entity';
import { TournamentModel } from '../../tournament/entities/tournament.entity';
import { Invite } from 'src/invite/entities/invite.entity';

@Entity('team')
export class TeamModel extends BaseModel {
    @PrimaryGeneratedColumn()
    id: number;
    
    @OneToMany(() => Invite, invite => invite.team)
    teamInvites: Invite[];
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
     * 팀 인원수
     */
    @Column({
        name: 'total_members',
    })
    totalMembers: number;

    /**
     * 팀 활동범위
     */
    @ManyToOne(() => LocationModel, (location) => location.team, {
        cascade: true,
    })
    @JoinColumn({
        name: 'location_id',
    })
    location: LocationModel;

    /**
     * 팀 생성자
     */
    @OneToOne(() => User, (user) => user.team)
    @JoinColumn({
        name: 'creator_id',
    })
    creator: User;

    @OneToMany(() => Member, (member) => member.team)
    members: Member[];

    @OneToMany(() => Match, (match) => match.hometeam)
    homeMatch: Match[];

    @OneToMany(() => Match, (match) => match.awayteam)
    awayMatch: Match[];

    @OneToOne(() => Chats, (chat) => chat.team)
    @JoinColumn({
        name: 'chat_id',
    })
    chat: Chats;

    @OneToMany(() => MatchFormation, (matchformation) => matchformation.team)
    matchformation: MatchFormation[];

    @DeleteDateColumn({
        name: 'deleted_at',
        nullable: true,
    })
    deletedAt: Date;

    @ManyToMany(() => TournamentModel, (tournament) => tournament.teams)
    tournament: TournamentModel[];
}
