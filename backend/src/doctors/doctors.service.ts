import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Doctor } from './doctor.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DoctorsService {
  constructor(@InjectRepository(Doctor) private repo: Repository<Doctor>) {}

  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(dto: Partial<Doctor>) {
    const d = this.repo.create(dto);
    return this.repo.save(d);
  }

  async update(id: number, dto: Partial<Doctor>) {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  delete(id: number) {
    return this.repo.delete(id);
  }
}
