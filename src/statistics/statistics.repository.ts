import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlayerStatistics } from './schemas/player-statistics.schema';
import { StatisticsRepositoryInterface } from './interfaces/statistics.repository.interface';

@Injectable()
export class StatisticsRepository implements StatisticsRepositoryInterface {
  constructor(@InjectModel(PlayerStatistics.name) private readonly model: Model<PlayerStatistics>) {}

  findOne(userId: string, organizationId: string) {
    return this.model.findOne({ userId, organizationId }).lean().exec() as Promise<PlayerStatistics | null>;
  }

  upsert(userId: string, organizationId: string, data: Partial<PlayerStatistics>) {
    return this.model.findOneAndUpdate(
      { userId, organizationId },
      { $set: { ...data, userId, organizationId } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean().exec() as unknown as Promise<PlayerStatistics>;
  }
}
