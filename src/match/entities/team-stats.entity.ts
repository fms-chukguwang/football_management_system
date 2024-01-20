import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  @Entity('team_statistics')
  export class TeamStats {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', nullable: false })
    team_id: number;

    @Column({ type: 'int', nullable: false })
    wins: number;

    @Column({ type: 'int', nullable: false })
    loses: number;

    @Column({ type: 'int', nullable: false })
    draws: number;

    @Column({ type: 'int', nullable: false })
    total_games: number;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  
    @DeleteDateColumn()
    deleted_at: Date;
  }
  