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
import { MatchResult } from './match-result.entity';
import { PlayerStats } from './player-stats.entity';
import { TeamModel } from '../../team/entities/team.entity';
  
  @Entity('matches')
  export class Match {
    @PrimaryGeneratedColumn()
    id: number;

    // Match와 MatchResult 간의 1대N 관계를 설정
    @OneToMany(() => MatchResult, (matchresult) => matchresult.match,{cascade: true})
    matchresult: MatchResult;

    // Match와 PlayerStats 간의 1대N 관계를 설정
    @OneToMany(() => PlayerStats, (playerstats) => playerstats.match)
    playerstats: PlayerStats;

    @ManyToOne(() => TeamModel,(team) => team.homeMatch)
    @JoinColumn({ name: 'home_team_id' })
    hometeam: TeamModel;

    @ManyToOne(() => TeamModel,(team) => team.awayMatch)
    @JoinColumn({ name: 'away_team_id' })
    awayteam: TeamModel;

    @Column({ type: 'int', nullable: false })
    owner_id: number;
  
    @Column({ type: 'date', nullable: false })
    date: string;
  
    @Column({ type: 'time', nullable: false })
    time: string;
  
    @Column({ type: 'int', nullable: false })
    soccer_field_id: number;
  
    @Column({ type: 'int', nullable: false })
    home_team_id: number;
  
    @Column({ type: 'int', nullable: false })
    away_team_id: number;
  
    @Column({ type: 'varchar', nullable: true })
    result: string;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  
    @DeleteDateColumn()
    deleted_at: Date;
  }
  