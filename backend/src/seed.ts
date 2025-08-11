import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

import { User } from './users/user.entity';
import { Doctor } from './doctors/doctor.entity';
import { Patient } from './patients/patient.entity';
import { Appointment } from './appointments/appointment.entity';
import { QueueItem } from './queue/queue-item.entity';
import * as bcrypt from 'bcrypt';

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'Raashu@123',
  database: process.env.DB_NAME || 'frontdesk_db',
  entities: [User, Doctor, Patient, Appointment, QueueItem],
  synchronize: true,
  logging: false,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('DB connected for seeding');

  const userRepo = AppDataSource.getRepository(User);
  const doctorRepo = AppDataSource.getRepository(Doctor);
  const patientRepo = AppDataSource.getRepository(Patient);
  const appointmentRepo = AppDataSource.getRepository(Appointment);
  const queueRepo = AppDataSource.getRepository(QueueItem);

//   // clear
//   await queueRepo.clear();
//   await appointmentRepo.clear();
//   await patientRepo.clear();
//   await doctorRepo.clear();
//   await userRepo.clear();

  // create sample front desk user
  const pw = 'frontdesk123';
  const passwordHash = await bcrypt.hash(pw, 10);
  const user = userRepo.create({ username: 'frontdesk', passwordHash, role: 'frontdesk' });
  await userRepo.save(user);
  console.log('Created frontdesk user -> username: frontdesk password:', pw);

  // sample doctors
  const d1 = doctorRepo.create({
    name: 'Dr. Aarav Sharma',
    specialization: 'General Physician',
    gender: 'Male',
    location: 'OPD-1',
    availability: [
      { day: 'Mon', slots: ['09:00', '09:30', '10:00', '10:30'] },
      { day: 'Tue', slots: ['11:00', '11:30', '12:00'] }
    ]
  });
  const d2 = doctorRepo.create({
    name: 'Dr. Meera Iyer',
    specialization: 'Pediatrics',
    gender: 'Female',
    location: 'OPD-2',
    availability: [
      { day: 'Mon', slots: ['09:00', '09:30', '10:00'] },
      { day: 'Wed', slots: ['13:00', '13:30'] }
    ]
  });
  const d3 = doctorRepo.create({
    name: 'Dr. Sanjay Rao',
    specialization: 'Dermatology',
    gender: 'Male',
    location: 'OPD-3',
    availability: [
      { day: 'Thu', slots: ['10:00', '10:30', '11:00'] },
      { day: 'Fri', slots: ['14:00', '14:30'] }
    ]
  });
  await doctorRepo.save([d1, d2, d3]);
  console.log('Inserted sample doctors');

  // sample patients + appointments + queue
  const p1 = patientRepo.create({ name: 'Rahul Verma', phone: '9876543210' });
  const p2 = patientRepo.create({ name: 'Anjali Rao', phone: '9123456780' });
  await patientRepo.save([p1, p2]);

  const ap1 = appointmentRepo.create({ doctor: d1 as any, patient: p1 as any, datetime: new Date().toISOString(), status: 'booked' });
  await appointmentRepo.save(ap1);

  const q1 = queueRepo.create({ patient: p2 as any, queueNumber: 1, status: 'waiting' });
  await queueRepo.save(q1);
  console.log('Inserted sample patients, appointments and queue');

  console.log('Seeding done');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
