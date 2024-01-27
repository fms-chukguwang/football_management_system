import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
import { TeamModel } from '../../team/entities/team.entity';
import { Match } from 'src/match/entities/match.entity';
import { Member } from 'src/member/entities/member.entity';
  
  @Entity('match_formations')
  export class MatchFormation {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Match,(match) => match.matchformation)
    @JoinColumn({ name: 'match_id' })
    match: Match;

    @ManyToOne(() => TeamModel,(team) => team.matchformation)
    @JoinColumn({ name: 'team_id' })
    team: TeamModel;

    @ManyToOne(() => Member,(meember) => meember.matchformation)
    @JoinColumn({ name: 'member_id' })
    member: Member;

    @Column({ type: 'int', nullable: false })
    match_id: number;

    @Column({ type: 'int', nullable: false })
    team_id: number;

    @Column({ type: 'int', nullable: false })
    member_id: number;
  
    @Column({ type: 'varchar', nullable: true })
    formation: string;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  
    @DeleteDateColumn()
    deleted_at: Date;
  }
  