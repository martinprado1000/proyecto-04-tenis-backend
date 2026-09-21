import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Auth } from 'src/auth/decorators';
import { ValidRoles } from 'src/auth/interfaces';
import { resolveOrganizationId } from 'src/common/utils/resolve-organization-id.util';
import { Role } from 'src/users/enums/role.enums';
import { UsersService } from 'src/users/users.service';
import { CreateSportsAnalysisDto } from './dto/create-sports-analysis.dto';
import { SportsAnalysisService } from './sportsAnalysis.service';

@Controller('admin/analisis-deportivo')
@Auth(ValidRoles.ADMIN, ValidRoles.SUPERADMIN)
export class SportsAnalysisController {
  constructor(
    private readonly service: SportsAnalysisService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveOrganizationId(req: any, userId: string) {
    const organizationId = resolveOrganizationId(req, req.user);
    if (organizationId) return organizationId;

    if (req.user?.roles?.includes(Role.SUPERADMIN)) {
      const selectedUser = await this.usersService.findOne(userId);
      return selectedUser.organizationId?.toString();
    }

    return undefined;
  }

  @Get()
  async getSummary(@Req() req: any, @Query('userId') userId: string) {
    if (!userId) {
      throw new Error('Se requiere userId para consultar el análisis.' );
    }
    const organizationId = await this.resolveOrganizationId(req, userId);
    if (!organizationId) {
      throw new BadRequestException('No se pudo determinar la organización.');
    }
    return this.service.getSummary(userId, organizationId);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateSportsAnalysisDto) {
    const organizationId = await this.resolveOrganizationId(req, dto.userId);
    if (!organizationId) {
      throw new BadRequestException('No se pudo determinar la organización.');
    }
    return this.service.create({ ...dto, organizationId });
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: CreateSportsAnalysisDto) {
    const organizationId = await this.resolveOrganizationId(req, dto.userId);
    if (!organizationId) throw new BadRequestException('No se pudo determinar la organización.');
    return this.service.update(id, dto.userId, organizationId, dto);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string, @Query('userId') userId: string) {
    if (!userId) throw new BadRequestException('Se requiere userId.');
    const organizationId = await this.resolveOrganizationId(req, userId);
    if (!organizationId) throw new BadRequestException('No se pudo determinar la organización.');
    return this.service.remove(id, userId, organizationId);
  }
}
