import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Team } from './schemas/team.schema';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamsRepositoryInterface } from './interfaces/teams-repository.interface';

@Injectable()
export class TeamsRepository implements TeamsRepositoryInterface {
  constructor(
    @InjectModel(Team.name) private teamModel: Model<Team>,
  ) {}

  async findAll(organizationId?: string): Promise<Team[]> {
    const filter: any = {};
    if (organizationId) filter.organizationId = organizationId;
    return await this.teamModel
      .find(filter)
      .populate('integrante1', 'name lastname email dni sexo')
      .populate('integrante2', 'name lastname email dni sexo')
      .exec();
  }

  async findById(id: string, organizationId?: string): Promise<Team | null> {
    const filter: any = { _id: id };
    if (organizationId) filter.organizationId = organizationId;
    return await this.teamModel
      .findOne(filter)
      .populate('integrante1', 'name lastname email dni sexo')
      .populate('integrante2', 'name lastname email dni sexo')
      .exec();
  }

  async create(createTeamDto: CreateTeamDto): Promise<Team> {
    const team = await this.teamModel.create(createTeamDto);
    return await team.populate([
      { path: 'integrante1', select: 'name lastname email dni sexo' },
      { path: 'integrante2', select: 'name lastname email dni sexo' },
    ]);
  }

  async update(id: string, updateTeamDto: UpdateTeamDto): Promise<Team | null> {
    return await this.teamModel
      .findByIdAndUpdate(id, updateTeamDto, { new: true })
      .populate('integrante1', 'name lastname email dni sexo')
      .populate('integrante2', 'name lastname email dni sexo')
      .exec();
  }

  async delete(id: string): Promise<Team | null> {
    return await this.teamModel.findByIdAndDelete(id).exec();
  }
}
