import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { OrganizationsService } from 'src/organizations/organizations.service';

@ApiTags('Public / Torneos')
@Controller('public/torneos')
export class PublicTournamentsController {
  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly orgService: OrganizationsService,
  ) {}

  @Get(':slug')
  @ApiResponse({ status: 200, description: 'Lista pública de torneos de la organización' })
  @ApiResponse({ status: 404, description: 'Organización no encontrada' })
  async getPublicTournaments(@Param('slug') slug: string) {
    const org = await this.orgService.findBySlug(slug);
    if (!org || !org.isActive) {
      throw new NotFoundException(`Organización con slug "${slug}" no encontrada o inactiva.`);
    }

    const orgId = org._id ? org._id.toString() : (org as any).id;
    const tournaments = await this.tournamentsService.findAll(orgId);
    return tournaments.filter((t) => t.isActive !== false);
  }
}
