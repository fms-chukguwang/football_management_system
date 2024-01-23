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
import { BaseModel } from '../../common/entities/base.entity';
import { TeamModel } from '../../team/entities/team.entity';
import { User } from '../../user/entities/user.entity';
import { PlayerStats } from 'src/match/entities/player-stats.entity';

@Entity('members')
export class Member extends BaseModel {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => User, (user) => user.member)
    @JoinColumn()
    user: User;

    @OneToOne(() => Profile, (profile) => profile.user)
    @JoinColumn()
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

    @Column({
        type: 'date',
    })
    joinDate: Date;
}
