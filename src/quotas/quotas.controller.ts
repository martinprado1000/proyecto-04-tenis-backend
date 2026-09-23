import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Auth, GetUser } from 'src/auth/decorators';
import { ValidRoles } from 'src/auth/interfaces';
import { resolveOrganizationId } from 'src/common/utils/resolve-organization-id.util';
import { CreateQuotaDto } from './dto/create-quota.dto';
import { QuotasService } from './quotas.service';

@Controller('admin/gestion-cuotas')
@Auth(ValidRoles.ADMIN, ValidRoles.SUPERADMIN)
export class QuotasController {
  constructor(private readonly service: QuotasService) {}

  private organizationId(req: any, user: any, allowAll = false) {
    const organizationId = resolveOrganizationId(req, user);
    if (!organizationId && allowAll && user?.roles?.includes(ValidRoles.SUPERADMIN)) return undefined;
    if (!organizationId) throw new BadRequestException('No se pudo determinar la organización.');
    return organizationId;
  }

  @Get()
  getMatrix(@Query('year') year: string, @Req() req: any, @GetUser() user: any) {
    const selectedYear = Number(year) || new Date().getFullYear();
    return this.service.findMatrix(this.organizationId(req, user, true), selectedYear);
  }

  @Post()
  create(@Body() dto: CreateQuotaDto, @Req() req: any, @GetUser() user: any) {
    return this.service.create(this.organizationId(req, user)!, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateQuotaDto>, @Req() req: any, @GetUser() user: any) {
    return this.service.update(id, this.organizationId(req, user)!, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any, @GetUser() user: any) {
    return this.service.remove(id, this.organizationId(req, user)!);
  }
}
