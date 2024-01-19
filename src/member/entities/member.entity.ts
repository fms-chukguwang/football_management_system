import { Column, Entity, ManyToOne, CreateDateColumn } from 'typeorm';
import { BaseModel } from 'src/common/entities/base.entity';
import { TeamModel } from 'src/team/entities/team.entity';
import { User } from 'src/user/entities/user.entity';
import { date } from 'joi';

@Entity('members')
export class Member extends BaseModel {
    @ManyToOne(() => User, (user) => user.member)
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

    @Column({
        type: 'date',
    })
    joinDate: Date;
}
