import { Tournament } from '../schemas/tournament.schema';
import { CreateTournamentDto } from '../dto/create-tournament.dto';
import { UpdateTournamentDto } from '../dto/update-tournament.dto';

export const TOURNAMENTS_REPOSITORY_INTERFACE = 'TOURNAMENTS_REPOSITORY_INTERFACE';

export interface TournamentsRepositoryInterface {
  findAll(organizationId?: string, withDeleted?: boolean): Promise<Tournament[]>;
  findAllRaw(organizationId?: string, withDeleted?: boolean): Promise<any[]>;
  findById(id: string, organizationId?: string, withDeleted?: boolean): Promise<Tournament | null>;
  create(createTournamentDto: CreateTournamentDto): Promise<Tournament>;
  update(id: string, updateTournamentDto: UpdateTournamentDto): Promise<Tournament | null>;
  delete(id: string): Promise<Tournament | null>;
}
