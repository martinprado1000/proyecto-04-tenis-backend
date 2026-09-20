import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tournament } from './schemas/tournament.schema';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { TournamentsRepositoryInterface } from './interfaces/tournaments-repository.interface';

@Injectable()
export class TournamentsRepository implements TournamentsRepositoryInterface {
  constructor(
    @InjectModel(Tournament.name) private tournamentModel: Model<Tournament>,
  ) {}

  async findAllRaw(organizationId?: string, withDeleted = false): Promise<any[]> {
    const filter: any = {};
    if (organizationId) filter.organizationId = organizationId;
    if (!withDeleted) filter.deletedAt = { $exists: false };
    return this.tournamentModel.find(filter)
      .populate('jugadores', 'name lastname email telefono dni sexo isActive categoria organizationId')
      .populate({ path: 'equipos', populate: [{ path: 'integrante1', select: 'name lastname email telefono dni sexo' }, { path: 'integrante2', select: 'name lastname email telefono dni sexo' }] })
      .lean().exec();
  }

  async findAll(organizationId?: string, withDeleted = false): Promise<Tournament[]> {
    const filter: any = {};
    if (organizationId) filter.organizationId = organizationId;
    if (!withDeleted) filter.deletedAt = { $exists: false };
    return await this.tournamentModel
      .find(filter)
      .populate('jugadores', 'name lastname email telefono dni sexo isActive categoria organizationId')
      .populate('jugadoresExcluidos', 'name lastname email telefono dni sexo isActive')
      .populate('equiposExcluidos')
      .populate({
        path: 'equipos',
        populate: [
          { path: 'integrante1', select: 'name lastname email telefono dni sexo' },
          { path: 'integrante2', select: 'name lastname email telefono dni sexo' },
        ],
      })
      .exec();
  }

  async findById(id: string, organizationId?: string, withDeleted = false): Promise<Tournament | null> {
    const filter: any = { _id: id };
    if (organizationId) filter.organizationId = organizationId;
    if (!withDeleted) filter.deletedAt = { $exists: false };
    return await this.tournamentModel
      .findOne(filter)
      .populate('jugadores', 'name lastname email telefono dni sexo isActive categoria organizationId')
      .populate('jugadoresExcluidos', 'name lastname email telefono dni sexo isActive')
      .populate('equiposExcluidos')
      .populate({
        path: 'equipos',
        populate: [
          { path: 'integrante1', select: 'name lastname email telefono dni sexo' },
          { path: 'integrante2', select: 'name lastname email telefono dni sexo' },
        ],
      })
      .exec();
  }

  async create(createTournamentDto: CreateTournamentDto): Promise<Tournament> {
    const tournament = await this.tournamentModel.create(createTournamentDto);
    return await tournament.populate([
      { path: 'jugadores', select: 'name lastname email telefono dni sexo categoria organizationId' },
      {
        path: 'equipos',
        populate: [
          { path: 'integrante1', select: 'name lastname email telefono dni sexo' },
          { path: 'integrante2', select: 'name lastname email telefono dni sexo' },
        ],
      },
    ]);
  }

  async update(id: string, updateTournamentDto: UpdateTournamentDto): Promise<Tournament | null> {
    return await this.tournamentModel
      .findByIdAndUpdate(id, updateTournamentDto, { new: true })
      .populate('jugadores', 'name lastname email telefono dni sexo')
      .populate({
        path: 'equipos',
        populate: [
          { path: 'integrante1', select: 'name lastname email telefono dni sexo' },
          { path: 'integrante2', select: 'name lastname email telefono dni sexo' },
        ],
      })
      .exec();
  }

  async delete(id: string): Promise<Tournament | null> {
    return await this.tournamentModel.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true }).exec();
  }
}
