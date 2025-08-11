import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from '../patients/patient.entity';
import { Doctor } from '../doctors/doctor.entity';

export type QueueStatus = 'waiting' | 'with_doctor' | 'completed';

@Entity()
export class QueueItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Patient, { eager: true })
  @JoinColumn()
  patient: Patient;

  @Column()
  queueNumber: number;

  @Column({ default: 'waiting' })
  status: QueueStatus;

  @ManyToOne(() => Doctor, { nullable: true, eager: true })
  @JoinColumn()
  doctor: Doctor | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
