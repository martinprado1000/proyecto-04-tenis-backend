import { Team } from '../schemas/team.schema';
import { CreateTeamDto } from '../dto/create-team.dto';
import { UpdateTeamDto } from '../dto/update-team.dto';

export const TEAMS_REPOSITORY_INTERFACE = 'TEAMS_REPOSITORY_INTERFACE';

export interface TeamsRepositoryInterface {
  findAll(organizationId?: string): Promise<Team[]>;
  findById(id: string, organizationId?: string): Promise<Team | null>;
  create(createTeamDto: CreateTeamDto): Promise<Team>;
  update(id: string, updateTeamDto: UpdateTeamDto): Promise<Team | null>;
  delete(id: string): Promise<Team | null>;
}
