import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';
import { BaseModel } from '../../common/entities/base.entity';
import { LocationModel } from '../../location/entities/location.entity';
import { TeamModel } from '../../team/entities/team.entity';
import {
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToOne,
    VersionColumn,
} from 'typeorm';

@Entity('tournament')
export class TournamentModel extends BaseModel {
    @IsString()
    @Column()
    name: string;

    @IsNumber()
    @Column()
    teamLimit: number;

    @IsDate()
    @Column()
    registerDeadline: Date;

    @IsDate()
    @Column()
    tournamentDate: Date;

    @IsNumber()
    @Column({ nullable: true })
    winningTeamId: number;

    @IsNumber()
    @Column({ nullable: true })
    runnerUpTeamId: number;

    @IsBoolean()
    @Column({
        default: false,
    })
    isFinished: boolean;

    @ManyToMany(() => TeamModel, (team) => team.tournament)
    @JoinTable()
    teams: TeamModel[];

    @IsBoolean()
    @Column({
        default: false,
    })
    isCancelled: boolean;

    @OneToOne(() => LocationModel, (location) => location.tournament)
    @JoinColumn()
    location: LocationModel;
}
