import { IsNumber, IsString } from 'class-validator';
import { BaseModel } from 'src/common/entities/base.entity';
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TeamModel } from '../../team/entities/team.entity';
import { LocationModel } from 'src/location/entities/location.entity';

@Entity('soccer_fields')
export class SoccerField extends BaseModel {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * 팀 구장
     */
    @ManyToOne(() => LocationModel, (locationfield) => locationfield.soccerfield, {
        cascade: true,
    })
    @JoinColumn({ name: 'location_id' })
    locationfield: LocationModel;

    @Column({ type: 'int', nullable: false })
    location_id: number;

    @Column({ type: 'varchar', nullable: true })
    field_name: string;
}
