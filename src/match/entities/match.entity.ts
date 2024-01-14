  import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  @Entity('matches')
  export class Match {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', nullable: false })
    owner_id: number;
  
    @Column({ type: 'date', nullable: false })
    date: string;
  
    @Column({ type: 'time', nullable: false })
    time: string;
  
    @Column({ type: 'int', nullable: false })
    field_id: number;
  
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
  