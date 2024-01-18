import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseModel } from 'src/common/entities/base.entity';
import { TeamModel } from 'src/team/entities/team.entity';
import { User } from 'src/user/entities/user.entity';

@Entity('members')
export class Member extends BaseModel {
    @OneToOne(() => User, (user) => user.member)
    @JoinColumn()
    user: User;

    @ManyToOne(() => TeamModel, (team) => team.members, {
        onDelete: 'CASCADE',
    })
    team: TeamModel;

    @Column({
        name: 'is_staff',
        default: false,
    })
    isStaff: boolean;
}
