import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('enrollments')
@Controller('enrollments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista inscrições do usuário' })
  async getMyEnrollments(@CurrentUser('sub') userId: string) {
    return this.enrollmentsService.getUserEnrollments(userId);
  }

  @Post('course/:courseId')
  @ApiOperation({ summary: 'Inscreve o usuário em um curso' })
  async enrollInCourse(
    @CurrentUser('sub') userId: string,
    @Param('courseId') courseId: string
  ) {
    return this.enrollmentsService.enroll(userId, courseId);
  }
}
