
import { Profile } from 'src/profile/entities/profile.entity';
import { TeamModel } from 'src/team/entities/team.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class Invite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  senderUserId: number;

  @ManyToOne(() => Profile)
  @JoinColumn()
  receiverProfile: Profile;

  @ManyToOne(() => TeamModel)
  @JoinColumn()
  team: TeamModel;

  @Column({ default: 'pending' }) // 초대 상태: pending(보류), accepted(수락), rejected(거절) 등
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
