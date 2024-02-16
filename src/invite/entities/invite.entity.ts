import { InviteStatus } from 'src/enums/invite-status.enum';
import { Profile } from 'src/profile/entities/profile.entity';
import { TeamModel } from 'src/team/entities/team.entity';
import { User } from 'src/user/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';


@Entity()
export class Invite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  isInvited: boolean;

  @ManyToOne(() => User)
  @JoinColumn()
  senderUser: User;

  @ManyToOne(() => Profile)
  @JoinColumn()
  receiverProfile: Profile;

  @ManyToOne(() => TeamModel)
  @JoinColumn()
  team: TeamModel;

  @Column({ type: 'enum', enum: InviteStatus, default: InviteStatus.NONE })
  status: InviteStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
