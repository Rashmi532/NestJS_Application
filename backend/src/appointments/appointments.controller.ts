import { Controller, Get, Post, Body, UseGuards, Param, Patch, Delete, BadRequestException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentStatus } from './appointment.entity';

@Controller('appointments')
export class AppointmentsController {
  constructor(private svc: AppointmentsService) {}

  @Get()
  getAll() {
    return this.svc.findAll();
  }

  @Get('doctor/:id')
  getByDoctor(@Param('id') id: string) {
    return this.svc.findByDoctor(+id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() body: any) {
    // body must include doctorId, patientId, datetime
    const dto = {
      doctor: { id: body.doctorId },
      patient: { id: body.patientId },
      datetime: body.datetime,
      status: 'booked' as AppointmentStatus
    };
    return this.svc.create(dto as any);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'))
  changeStatus(@Param('id') id: string, @Body() b: { status: string }) {
    const allowed: AppointmentStatus[] = ['booked', 'completed', 'canceled'];
    if (!allowed.includes(b.status as AppointmentStatus)) {
      throw new BadRequestException(`Invalid status. Allowed: ${allowed.join(', ')}`);
    }
    return this.svc.updateStatus(+id, b.status as AppointmentStatus);
  }

  @Patch(':id/reschedule')
  @UseGuards(AuthGuard('jwt'))
  reschedule(@Param('id') id: string, @Body() b: { datetime: string }) {
    return this.svc.reschedule(+id, b.datetime);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: string) {
    return this.svc.delete(+id);
  }
}
