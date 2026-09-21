import { Controller, Get, Req } from '@nestjs/common';
import { Auth } from 'src/auth/decorators';
import { ValidRoles } from 'src/auth/interfaces';
import { resolveOrganizationId } from 'src/common/utils/resolve-organization-id.util';
import { SportsAnalysisService } from './sportsAnalysis.service';

@Controller('analisis-deportivo')
@Auth(ValidRoles.USER, ValidRoles.ADMIN, ValidRoles.SUPERADMIN)
export class PlayerSportsAnalysisController {
  constructor(private readonly service: SportsAnalysisService) {}

  @Get('mio')
  async getMine(@Req() req: any) {
    const userId = String(req.user?._id || req.user?.id || '');
    const organizationId = resolveOrganizationId(req, req.user);
    return this.service.getSummary(userId, organizationId || '');
  }
}