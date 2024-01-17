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
  
  @Entity('player_statistics')
  export class PlayerStats {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Match)
    @JoinColumn({ name: 'match_id' })
    match: Match;

    @Column({ type: 'int', nullable: false })
    team_id: number;

    @Column({ type: 'int', nullable: false })
    match_id: number;

    @Column({ type: 'int', nullable: false })
    member_id: number;

    @Column({ type: 'int', nullable: false })
    assists: number;

    @Column({ type: 'int', nullable: false })
    goals: number;

    @Column({ type: 'int', nullable: false })
    headings: number;

    @Column({ type: 'int', nullable: false })
    yellow_cards: number;

    @Column({ type: 'int', nullable: false })
    red_cards: number;

    @Column({ type: 'int', nullable: false })
    substitutions: number;

    @Column({ type: 'int', nullable: false })
    save: number;

    @Column({ type: 'int', nullable: false })
    intercepts: number;

    @Column({ type: 'int', nullable: false })
    pass: number;

    @Column({ type: 'double', nullable: false })
    pass_success: number;

    @Column({ type: 'double', nullable: false })
    heading_success: number;

    @Column({ type: 'double', nullable: false })
    shooting_success: number;

    @Column({ type: 'int', nullable: false })
    shooting: number;

    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  
    @DeleteDateColumn()
    deleted_at: Date;
  }
  