import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueueItem, QueueStatus } from './queue-item.entity';
import { Repository } from 'typeorm';
import { Patient } from '../patients/patient.entity';

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(QueueItem) private repo: Repository<QueueItem>,
    @InjectRepository(Patient) private patientRepo: Repository<Patient>
  ) {}

  async addWalkIn(patientData: Partial<Patient>) {
    const patient = this.patientRepo.create(patientData);
    const saved = await this.patientRepo.save(patient);

    // compute next queue number
    const last = await this.repo.createQueryBuilder('q').orderBy('q.queueNumber', 'DESC').getOne();
    const nextQueue = last ? last.queueNumber + 1 : 1;

    const item = this.repo.create({ patient: saved, queueNumber: nextQueue, status: 'waiting' });
    return this.repo.save(item);
  }

  findAll() {
    return this.repo.find({ order: { queueNumber: 'ASC' } });
  }

  async updateStatus(id: number, status: QueueStatus) {
    await this.repo.update(id, { status });
    return this.repo.findOne({ where: { id } });
  }

  async assignDoctor(id: number, doctorId: number) {
    await this.repo.update(id, { doctor: { id: doctorId } as any, status: 'with_doctor' });
    return this.repo.findOne({ where: { id } });
  }

  delete(id: number) {
    return this.repo.delete(id);
  }
}
