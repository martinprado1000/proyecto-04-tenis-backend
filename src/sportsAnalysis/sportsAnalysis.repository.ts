import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SportsAnalysisSession } from './sportsAnalysis.schema';

@Injectable()
export class SportsAnalysisRepository {
  constructor(
    @InjectModel(SportsAnalysisSession.name)
    private readonly model: Model<SportsAnalysisSession>,
  ) {}

  async findByUser(userId: string, organizationId: string) {
    return this.model
      .find({ userId, organizationId })
      .sort({ date: -1, createdAt: -1 })
      .lean()
      .exec();
  }

  async create(data: Partial<SportsAnalysisSession>) {
    const created = new this.model(data);
    return created.save();
  }

  async findById(id: string, userId: string, organizationId: string) {
    return this.model.findOne({ _id: id, userId, organizationId }).exec();
  }

  async updateById(id: string, userId: string, organizationId: string, data: Partial<SportsAnalysisSession>) {
    return this.model
      .findOneAndUpdate({ _id: id, userId, organizationId }, data, { new: true, runValidators: true })
      .lean()
      .exec();
  }

  async deleteById(id: string, userId: string, organizationId: string) {
    return this.model.deleteOne({ _id: id, userId, organizationId }).exec();
  }
}
