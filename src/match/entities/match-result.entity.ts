import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Match } from './match.entity';

@Entity('match_results')
export class MatchResult {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Match, (match) => match.matchresult, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'match_id' })
    match: Match;

    @Column({ type: 'int', nullable: false })
    match_id: number;

    @Column({ type: 'int', nullable: false })
    team_id: number;

    @Column({ type: 'json', nullable: true })
    goals: { playerId: number; count: number }[];

    @Column({ type: 'int', nullable: false })
    corner_kick: number;

    @Column({ type: 'json', nullable: true })
    red_cards: { playerId: number; count: number }[];

    @Column({ type: 'simple-array', nullable: true })
    yellow_cards: number[];

    @Column({ type: 'json', nullable: true })
    substitions: { inPlayerId: number; outPlayerId: number }[];

    @Column({ type: 'json', nullable: true })
    saves: { playerId: number; count: number }[];

    @Column({ type: 'json', nullable: true })
    assists: { playerId: number; count: number }[];

    @Column({ type: 'int', nullable: false })
    passes: number;

    @Column({ type: 'boolean', default: false })
    clean_sheet: boolean;

    @Column({ type: 'int', nullable: false })
    penalty_kick: number;

    @Column({ type: 'int', nullable: false })
    free_kick: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;
}
