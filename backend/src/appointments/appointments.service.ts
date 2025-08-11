import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AppointmentsService {
  constructor(@InjectRepository(Appointment) private repo: Repository<Appointment>) {}

  create(data: Partial<Appointment>) {
    const a = this.repo.create(data);
    return this.repo.save(a);
  }

  findAll() {
    return this.repo.find({ order: { datetime: 'ASC' } });
  }

  findByDoctor(doctorId: number) {
    return this.repo.find({ where: { doctor: { id: doctorId } }, order: { datetime: 'ASC' } });
  }

  async updateStatus(id: number, status: AppointmentStatus) {
    await this.repo.update(id, { status });
    return this.repo.findOne({ where: { id } });
  }

  async reschedule(id: number, datetime: string) {
    await this.repo.update(id, { datetime });
    return this.repo.findOne({ where: { id } });
  }

  delete(id: number) {
    return this.repo.delete(id);
  }
}
