import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  Req,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import {
  CreateTournamentDto,
  UpdateTournamentDto,
  ResponseTournamentDto,
  AssignJugadoresDto,
  AssignEquiposDto,
} from './dto';
import { idMongoPipe } from 'src/common/pipes/idMongo.pipe';
import { Auth, GetUser } from 'src/auth/decorators';
import { ValidRoles } from 'src/auth/interfaces';

@ApiTags('Admin / Torneos')
@Controller('admin/torneos')
@Auth(ValidRoles.SUPERADMIN, ValidRoles.ADMIN)
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Tournaments list', type: [ResponseTournamentDto] })
  async findAll(@Req() req: any, @GetUser() user: any) {
    const organizationId = req.organizationId || user?.organizationId?.toString();
    if (!organizationId) {
      return [];
    }
    return await this.tournamentsService.findAll(organizationId);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Tournament found', type: ResponseTournamentDto })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async findOne(@Param('id', idMongoPipe) id: string, @Req() req: any) {
    return await this.tournamentsService.findOne(id, req.organizationId);
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Tournament created', type: ResponseTournamentDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createTournamentDto: CreateTournamentDto, @Req() req: any) {
    if (req.organizationId) createTournamentDto['organizationId'] = req.organizationId;
    return await this.tournamentsService.create(createTournamentDto);
  }

  @Post(':id/fechas/generar')
  @ApiResponse({ status: 200, description: 'Fechas generadas', type: ResponseTournamentDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async generarFechas(@Param('id', idMongoPipe) id: string, @Req() req: any) {
    return await this.tournamentsService.generarFechas(id, req.organizationId);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Tournament updated', type: ResponseTournamentDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async update(
    @Param('id', idMongoPipe) id: string,
    @Body() updateTournamentDto: UpdateTournamentDto,
    @Req() req: any,
  ) {
    return await this.tournamentsService.update(id, updateTournamentDto, req.organizationId);
  }

  @Patch(':id/jugadores')
  @ApiResponse({ status: 200, description: 'Jugadores asignados al torneo', type: ResponseTournamentDto })
  @ApiResponse({ status: 400, description: 'Bad request por incompatibilidad de formato o género' })
  async assignJugadores(
    @Param('id', idMongoPipe) id: string,
    @Body() assignJugadoresDto: AssignJugadoresDto,
    @Req() req: any,
  ) {
    return await this.tournamentsService.assignJugadores(id, assignJugadoresDto.jugadores, req.organizationId, assignJugadoresDto.modo, assignJugadoresDto.reemplazarId, assignJugadoresDto.nuevoId);
  }

  @Patch(':id/equipos')
  @ApiResponse({ status: 200, description: 'Equipos asignados al torneo', type: ResponseTournamentDto })
  @ApiResponse({ status: 400, description: 'Bad request por incompatibilidad de formato o tipo de equipo' })
  async assignEquipos(
    @Param('id', idMongoPipe) id: string,
    @Body() assignEquiposDto: AssignEquiposDto,
    @Req() req: any,
  ) {
    return await this.tournamentsService.assignEquipos(id, assignEquiposDto.equipos, req.organizationId, assignEquiposDto.modo, assignEquiposDto.reemplazarId, assignEquiposDto.nuevoId);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Tournament deleted' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async remove(@Param('id', idMongoPipe) id: string, @Req() req: any) {
    return await this.tournamentsService.delete(id, req.organizationId);
  }

  @Patch(':id/fechas/:idx')
  @ApiResponse({ status: 200, description: 'Fecha actualizada', type: ResponseTournamentDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateFecha(
    @Param('id', idMongoPipe) id: string,
    @Param('idx') idx: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return await this.tournamentsService.updateFecha(id, Number(idx), body, req.organizationId);
  }
}
