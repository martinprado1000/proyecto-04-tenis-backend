import { Controller, Get, Param, Req } from '@nestjs/common';
import { Auth, GetUser } from 'src/auth/decorators';
import { TournamentsService } from './tournaments.service';

@Controller()
@Auth()
export class PlayerTournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get('fechas')
  async getMyDates(@GetUser() user: any, @Req() req: any) {
    const userId = String(user._id ?? user.id);
    const organizationId = req.organizationId || user.organizationId?.toString();
    const { singles, dobles } = await this.tournamentsService.getPlayerMatches(userId, organizationId);
    return {
      singles: singles.flatMap((tournament) => tournament.matches.map((match) => ({
        ...match,
        torneo: tournament.name,
      }))),
      dobles: dobles.flatMap((tournament) => tournament.matches.map((match) => ({
        ...match,
        torneo: tournament.name,
      }))),
    };
  }

  @Get('resultados-torneo/:id')
  async getTournamentResult(@Param('id') id: string, @Req() req: any) {
    return this.tournamentsService.findOne(id, req.organizationId);
  }

  @Get('resultados-debug')
  async getResultsDebug(@GetUser() user: any, @Req() req: any) {
    const userId = String(user._id ?? user.id);
    const organizationId = req.organizationId || user.organizationId?.toString();
    const tournaments = await this.tournamentsService.findAll(organizationId);
    return {
      userId,
      userOrganizationId: user.organizationId?.toString(),
      requestOrganizationId: req.organizationId,
      resolvedOrganizationId: organizationId,
      tournamentsCount: tournaments.length,
      tournaments: tournaments.slice(0, 3).map((t) => ({
        id: t.id,
        name: t.name,
        players: (t.jugadores || []).map((p) => ({ id: p.id, name: p.nombre })),
        dates: (t.fechas || []).slice(0, 3).map((f) => ({ p1: f.participante1?.id, p2: f.participante2?.id, jugado: f.jugado, sets: f.sets })),
      })),
    };
  }

  @Get('resultados')
  async getMyResults(@GetUser() user: any, @Req() req: any) {
    const userId = String(user._id ?? user.id);
    const organizationId = req.organizationId || user.organizationId?.toString();
    const { torneos } = await this.tournamentsService.getPlayerMatches(userId, organizationId);
    return torneos;
  }
}
