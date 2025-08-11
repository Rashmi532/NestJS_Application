import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Patient } from './patient.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PatientsService {
  constructor(@InjectRepository(Patient) private repo: Repository<Patient>) {}

  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(dto: Partial<Patient>) {
    const patient = this.repo.create(dto);
    return this.repo.save(patient);
  }

  async update(id: number, dto: Partial<Patient>) {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  delete(id: number) {
    return this.repo.delete(id);
  }
}
