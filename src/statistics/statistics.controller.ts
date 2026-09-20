import { Controller, Get, Query, Req } from '@nestjs/common';
import { Auth, GetUser } from 'src/auth/decorators';
import { StatisticsQueryDto } from './dto/statistics-query.dto';
import { StatisticsService } from './statistics.service';
import { IsMongoId, IsOptional } from 'class-validator';

class H2HQueryDto {
  @IsMongoId()
  rivalId: string;
}

class TipoQueryDto {
  @IsOptional()
  tipo?: string;
}

@Controller('statistics')
@Auth()
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('me')
  getMine(@GetUser() user: any, @Req() req: any, @Query() query: StatisticsQueryDto) {
    const organizationId = req.organizationId || user.organizationId?.toString();
    return this.statisticsService.getMine(String(user._id ?? user.id), organizationId, query);
  }

  @Get('players')
  getPlayers(@Req() req: any, @GetUser() user: any) {
    const organizationId = req.organizationId || user.organizationId?.toString();
    return this.statisticsService.getPlayers(organizationId);
  }

  @Get('compare')
  getH2H(@GetUser() user: any, @Req() req: any, @Query() query: H2HQueryDto) {
    const organizationId = req.organizationId || user.organizationId?.toString();
    return this.statisticsService.getH2H(String(user._id ?? user.id), query.rivalId, organizationId);
  }
}
