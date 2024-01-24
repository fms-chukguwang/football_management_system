import { IsNumber, IsString } from 'class-validator';
import { BaseModel } from '../../common/entities/base.entity';
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TeamModel } from '../../team/entities/team.entity';
import { LocationModel } from '../../location/entities/location.entity';

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

    @Column({ type: 'varchar', nullable: true })
    image_url: string;

    @Column({ type: 'varchar', nullable: true })
    district: string;

    @Column({ type: 'varchar', nullable: true })
    phone_number: string;

    @Column({ type: 'double', nullable: true })
    x_coord: number;

    @Column({ type: 'double', nullable: true })
    y_coord: number;
}
