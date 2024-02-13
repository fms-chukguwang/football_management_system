import { Profile } from '../../profile/entities/profile.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseModel } from '../../common/entities/base.entity';
import { TeamModel } from '../../team/entities/team.entity';
import { User } from '../../user/entities/user.entity';
import { PlayerStats } from '../../match/entities/player-stats.entity';
import { MatchFormation } from '../../formation/entities/formation.entity';

@Entity('members')
export class Member extends BaseModel {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.member)
    @JoinColumn({
        name: 'user_id',
    })
    user: User;

    @ManyToOne(() => Profile, (profile) => profile.member)
    @JoinColumn({
        name: 'profile_id',
    })
    profile: Profile;

    @ManyToOne(() => TeamModel, (team) => team.members, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({
        name: 'team_id',
    })
    team: TeamModel;

    @OneToMany(() => PlayerStats, (playerstats) => playerstats.member)
    playerstats: PlayerStats[];

    @OneToMany(() => MatchFormation, (matchformation) => matchformation.member)
    matchformation: MatchFormation[];

    @Column({
        name: 'is_staff',
        default: false,
    })
    isStaff: boolean;

    @CreateDateColumn({
        name: 'join_date',
        type: 'timestamp',
        precision: 6,
        default: () => 'CURRENT_TIMESTAMP(6)',
    })
    joinDate: Date;
}
