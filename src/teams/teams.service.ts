import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTeamDto, UpdateTeamDto } from './dto';
import { Sexo } from 'src/users/enums/role.enums';
import {
  TEAMS_REPOSITORY_INTERFACE,
  TeamsRepositoryInterface,
} from './interfaces/teams-repository.interface';
import { UsersService } from 'src/users/users.service';
import { CustomLoggerService } from 'src/logger/logger.service';

@Injectable()
export class TeamsService {
  constructor(
    @Inject(TEAMS_REPOSITORY_INTERFACE)
    private readonly teamsRepository: TeamsRepositoryInterface,
    private readonly usersService: UsersService,
    private readonly logger: CustomLoggerService,
  ) {}

  async findAll(organizationId?: string): Promise<any[]> {
    const teams = await this.teamsRepository.findAll(organizationId);
    return teams.map((t) => this.mapTeamToResponse(t));
  }

  async findOne(id: string, organizationId?: string): Promise<any> {
    const team = await this.teamsRepository.findById(id, organizationId);
    if (!team) {
      throw new NotFoundException(`Equipo con id ${id} no encontrado`);
    }
    return this.mapTeamToResponse(team);
  }

  async create(createTeamDto: CreateTeamDto): Promise<any> {
    const { name, integrante1, integrante2 } = createTeamDto;

    if (integrante1 === integrante2) {
      throw new BadRequestException(
        'El integrante 1 y el integrante 2 no pueden ser la misma persona',
      );
    }

    // Validar que ambos integrantes existan
    const usuario1 = await this.usersService.findOne(integrante1);
    const usuario2 = await this.usersService.findOne(integrante2);

    if (createTeamDto['organizationId']) {
      if (String(usuario1.organizationId || '') !== String(createTeamDto['organizationId']) || String(usuario2.organizationId || '') !== String(createTeamDto['organizationId'])) {
        throw new BadRequestException('Los integrantes deben pertenecer a la organización actual.');
      }
    }

    if (!usuario1.isActive) {
      throw new BadRequestException('El integrante 1 no está activo y no puede ser asignado a un equipo');
    }
    if (!usuario2.isActive) {
      throw new BadRequestException('El integrante 2 no está activo y no puede ser asignado a un equipo');
    }

    // Validar que el sexo de los integrantes sea compatible con el tipo de equipo
    const tipoUpper = (createTeamDto.tipo || '').toString().toUpperCase();
    if (tipoUpper === 'MASCULINO') {
      if ((usuario1.sexo || '').toUpperCase() !== Sexo.MASCULINO) {
        throw new BadRequestException('El integrante 1 no es Masculino. No puede asignarse a un equipo Masculino.');
      }
      if ((usuario2.sexo || '').toUpperCase() !== Sexo.MASCULINO) {
        throw new BadRequestException('El integrante 2 no es Masculino. No puede asignarse a un equipo Masculino.');
      }
    }
    if (tipoUpper === 'FEMENINO') {
      if ((usuario1.sexo || '').toUpperCase() !== Sexo.FEMENINO) {
        throw new BadRequestException('El integrante 1 no es Femenino. No puede asignarse a un equipo Femenino.');
      }
      if ((usuario2.sexo || '').toUpperCase() !== Sexo.FEMENINO) {
        throw new BadRequestException('El integrante 2 no es Femenino. No puede asignarse a un equipo Femenino.');
      }
    }
    if (tipoUpper === 'MIXTO' && (usuario1.sexo || '').toUpperCase() === (usuario2.sexo || '').toUpperCase()) {
      throw new BadRequestException('Un equipo mixto debe tener un integrante masculino y uno femenino.');
    }

    const newTeam = await this.teamsRepository.create(createTeamDto);
    this.logger.log(TeamsService.name, `Equipo ${name} creado con id ${newTeam._id}`);
    return this.mapTeamToResponse(newTeam);
  }

  async update(id: string, updateTeamDto: UpdateTeamDto, organizationId?: string): Promise<any> {
    const team = await this.teamsRepository.findById(id, organizationId);
    if (!team) {
      throw new NotFoundException(`Equipo con id ${id} no encontrado`);
    }

    const integrante1 = updateTeamDto.integrante1 || (team.integrante1 as any)?._id?.toString() || team.integrante1;
    const integrante2 = updateTeamDto.integrante2 || (team.integrante2 as any)?._id?.toString() || team.integrante2;

    if (integrante1 && integrante2 && integrante1 === integrante2) {
      throw new BadRequestException(
        'El integrante 1 y el integrante 2 no pueden ser la misma persona',
      );
    }

    if (updateTeamDto.integrante1) {
      const u1 = await this.usersService.findOne(updateTeamDto.integrante1);
      if (!u1.isActive) throw new BadRequestException('El integrante 1 no está activo y no puede ser asignado a un equipo');
    }
    if (updateTeamDto.integrante2) {
      const u2 = await this.usersService.findOne(updateTeamDto.integrante2);
      if (!u2.isActive) throw new BadRequestException('El integrante 2 no está activo y no puede ser asignado a un equipo');
    }

    const integ1Id = updateTeamDto.integrante1 || (team.integrante1 as any)?._id?.toString() || team.integrante1;
    const integ2Id = updateTeamDto.integrante2 || (team.integrante2 as any)?._id?.toString() || team.integrante2;

    if (updateTeamDto['organizationId']) {
      const u1 = await this.usersService.findOne(integ1Id);
      const u2 = await this.usersService.findOne(integ2Id);
      if (String(u1.organizationId || '') !== String(updateTeamDto['organizationId']) || String(u2.organizationId || '') !== String(updateTeamDto['organizationId'])) {
        throw new BadRequestException('Los integrantes deben pertenecer a la organización actual.');
      }
    }

    // Si se está actualizando tipo o integrantes, validar compatibilidad de sexo
    const newTipo = updateTeamDto.tipo ? updateTeamDto.tipo.toString().toUpperCase() : (team.tipo || '').toString().toUpperCase();
    if (newTipo === 'MASCULINO') {
      const u1 = await this.usersService.findOne(integ1Id);
      const u2 = await this.usersService.findOne(integ2Id);
      if ((u1.sexo || '').toUpperCase() !== Sexo.MASCULINO || (u2.sexo || '').toUpperCase() !== Sexo.MASCULINO) {
        throw new BadRequestException('Los integrantes deben ser Masculinos para un equipo Masculino');
      }
    }
    if (newTipo === 'FEMENINO') {
      const u1 = await this.usersService.findOne(integ1Id);
      const u2 = await this.usersService.findOne(integ2Id);
      if ((u1.sexo || '').toUpperCase() !== Sexo.FEMENINO || (u2.sexo || '').toUpperCase() !== Sexo.FEMENINO) {
        throw new BadRequestException('Los integrantes deben ser Femeninos para un equipo Femenino');
      }
    }
    if (newTipo === 'MIXTO') {
      const u1 = await this.usersService.findOne(integ1Id);
      const u2 = await this.usersService.findOne(integ2Id);
      if ((u1.sexo || '').toUpperCase() === (u2.sexo || '').toUpperCase()) {
        throw new BadRequestException('Un equipo mixto debe tener un integrante masculino y uno femenino.');
      }
    }

    const updatedTeam = await this.teamsRepository.update(id, updateTeamDto);
    this.logger.log(TeamsService.name, `Equipo con id ${id} actualizado`);
    return this.mapTeamToResponse(updatedTeam);
  }

  async delete(id: string, organizationId?: string): Promise<void> {
    const team = await this.teamsRepository.findById(id, organizationId);
    if (!team) {
      throw new NotFoundException(`Equipo con id ${id} no encontrado`);
    }
    await this.teamsRepository.delete(id);
    this.logger.log(TeamsService.name, `Equipo con id ${id} eliminado`);
  }

  private mapTeamToResponse(team: any) {
    const obj = team.toObject ? team.toObject() : team;

    const mapUser = (user: any) => {
      if (!user) return null;
      if (typeof user === 'string') return { id: user, nombre: '', apellido: '', email: '' };
      const uObj = user.toObject ? user.toObject() : user;
      return {
        id: uObj._id ? uObj._id.toString() : uObj.id,
        nombre: uObj.name || uObj.nombre || '',
        apellido: uObj.lastname || uObj.apellido || '',
        email: uObj.email || '',
        dni: uObj.dni || '',
        sexo: uObj.sexo || '',
        isActive: uObj.isActive ?? true,
      };
    };

    return {
      id: obj._id ? obj._id.toString() : obj.id,
      name: obj.name,
      integrante1: mapUser(obj.integrante1),
      integrante2: mapUser(obj.integrante2),
      tipo: obj.tipo,
      organizationId: obj.organizationId?._id?.toString() || obj.organizationId?.toString() || null,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }
}
