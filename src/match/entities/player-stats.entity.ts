import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
import { Match } from './match.entity';
import { Member } from '../../member/entities/member.entity';
  
  @Entity('player_statistics')
  export class PlayerStats {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Match)
    @JoinColumn({ name: 'match_id' })
    match: Match;

    @ManyToOne(() => Member,(member) => member.playerstats)
    @JoinColumn({ name: 'member_id' })
    member: Member;

    @Column({ type: 'int', nullable: false })
    team_id: number;

    @Column({ type: 'int', nullable: false })
    match_id: number;

    @Column({ type: 'int', nullable: false })
    member_id: number;

    @Column({ type: 'int', nullable: false })
    clean_sheet: number;

    @Column({ type: 'int', nullable: false })
    assists: number;

    @Column({ type: 'int', nullable: false })
    goals: number;

    @Column({ type: 'int', nullable: false })
    yellow_cards: number;

    @Column({ type: 'int', nullable: false })
    red_cards: number;

    @Column({ type: 'int', nullable: false })
    substitutions: number;

    @Column({ type: 'int', nullable: false })
    save: number;

    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  
    @DeleteDateColumn()
    deleted_at: Date;
  }
  