import { PlayerStatistics } from '../schemas/player-statistics.schema';

export const STATISTICS_REPOSITORY = 'STATISTICS_REPOSITORY';

export interface StatisticsRepositoryInterface {
  findOne(userId: string, organizationId: string): Promise<PlayerStatistics | null>;
  upsert(userId: string, organizationId: string, data: Partial<PlayerStatistics>): Promise<PlayerStatistics>;
}
