<<<<<<< HEAD
import { Profile } from 'src/profile/entities/profile.entity';
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
=======

import { Profile } from '../../profile/entities/profile.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
>>>>>>> 64d43b7c012aeda419197286e6794b049bbe1f41
import { BaseModel } from '../../common/entities/base.entity';
import { TeamModel } from '../../team/entities/team.entity';
import { User } from '../../user/entities/user.entity';
import { PlayerStats } from '../../match/entities/player-stats.entity';

@Entity('members')
export class Member extends BaseModel {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => User, (user) => user.member)
    @JoinColumn()
    user: User;

<<<<<<< HEAD
    @OneToOne(() => Profile, (profile) => profile.user)
    @JoinColumn()
=======
    @ManyToOne(() => Profile, (profile) => profile.member)
>>>>>>> 64d43b7c012aeda419197286e6794b049bbe1f41
    profile: Profile;

    @ManyToOne(() => TeamModel, (team) => team.members, {
        onDelete: 'CASCADE',
    })
    team: TeamModel;

    @OneToMany(() => PlayerStats, (playerstats) => playerstats.member)
    playerstats: PlayerStats[];

    @Column({
        name: 'is_staff',
        default: false,
    })
    isStaff: boolean;

    @CreateDateColumn({
        name: 'join_date',
    })
    joinDate: Date;
    
}
