import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  specialization: string;

  @Column()
  gender: string;

  @Column()
  location: string;

  @Column('simple-json', { nullable: true })
  // example: [{ day: 'Mon', slots: ['09:00', '09:30', ...] }, ...]
  availability: { day: string; slots: string[] }[];
}
