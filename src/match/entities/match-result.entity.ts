import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
import { Match } from './match.entity';
  
  @Entity('match_results')
  export class MatchResult {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => Match,(match) => match.matchresult, {cascade: true})
    @JoinColumn({ name: 'match_id' })
    match: Match;
  
    @Column({ type: 'date', nullable: false })
    date: string;
  
    @Column({ type: 'time', nullable: false })
    time: string;

    @Column({ type: 'int', nullable: false })
    match_id: number;

    @Column({ type: 'int', nullable: false })
    owner_id: number;
  
    @Column({ type: 'int', nullable: false })
    soccer_field_id: number;
  
    @Column({ type: 'int', nullable: false })
    home_team_id: number;
  
    @Column({ type: 'int', nullable: false })
    away_team_id: number;

    @Column({ type: 'int', nullable: false })
    win: number;

    @Column({ type: 'int', nullable: false })
    lose: number;

    @Column({ type: 'boolean', nullable: false })
    draw: boolean;

    @Column({ type: 'int', nullable: false })
    red_cards: number;   
    
    @Column({ type: 'int', nullable: false })
    yellow_cards: number;

    @Column({ type: 'int', nullable: false })
    substitions: number;

    @Column({ type: 'int', nullable: false })
    save: number;

    @Column({ type: 'int', nullable: false })
    intercept: number;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  
    @DeleteDateColumn()
    deleted_at: Date;
  }
  