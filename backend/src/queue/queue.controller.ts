import { Controller, Get, Post, Body, Param, Patch, UseGuards, BadRequestException } from '@nestjs/common';
import { QueueService } from './queue.service';
import { AuthGuard } from '@nestjs/passport';
import { QueueStatus } from './queue-item.entity';

@Controller('queue')
export class QueueController {
  constructor(private svc: QueueService) {}

  @Get()
  getQueue() {
    return this.svc.findAll();
  }

  @Post('walkin')
  @UseGuards(AuthGuard('jwt'))
  addWalkIn(@Body() body: { name: string; phone?: string; notes?: string }) {
    return this.svc.addWalkIn(body);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'))
  updateStatus(@Param('id') id: string, @Body() b: { status: string }) {
    const allowed: QueueStatus[] = ['waiting', 'with_doctor', 'completed'];
    if (!allowed.includes(b.status as QueueStatus)) {
      throw new BadRequestException(`Invalid status. Allowed: ${allowed.join(', ')}`);
    }
    return this.svc.updateStatus(+id, b.status as QueueStatus);
  }

  @Patch(':id/assign-doctor')
  @UseGuards(AuthGuard('jwt'))
  assignDoctor(@Param('id') id: string, @Body() b: { doctorId: number }) {
    return this.svc.assignDoctor(+id, b.doctorId);
  }
}
