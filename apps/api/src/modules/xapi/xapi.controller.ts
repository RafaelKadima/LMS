import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { XAPIService } from './xapi.service';
import { SendStatementDto } from './dto';

@ApiTags('xapi')
@Controller('xapi')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class XAPIController {
  constructor(private readonly xapiService: XAPIService) {}

  @Post('statements')
  @ApiOperation({ summary: 'Envia statement xAPI para o LRS (via proxy)' })
  @ApiResponse({ status: 202, description: 'Statement enfileirado para envio' })
  async sendStatement(@CurrentUser() user: any, @Body() dto: SendStatementDto) {
    return this.xapiService.queueStatement(user, dto);
  }
}
