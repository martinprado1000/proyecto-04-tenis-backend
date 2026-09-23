import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quota } from './schemas/quota.schema';

@Injectable()
export class QuotasRepository {
  constructor(@InjectModel(Quota.name) private readonly model: Model<Quota>) {}

  findAll(organizationId: string | undefined, year: number) {
    return this.model.find({ year, ...(organizationId ? { organizationId } : {}) }).populate('userId', 'name lastname email').sort({ month: 1 }).lean().exec();
  }

  findById(id: string, organizationId: string) {
    return this.model.findOne({ _id: id, organizationId }).populate('userId', 'name lastname email').lean().exec();
  }

  create(data: Partial<Quota>) {
    return this.model.create(data);
  }

  update(id: string, organizationId: string, data: Partial<Quota>) {
    return this.model.findOneAndUpdate({ _id: id, organizationId }, data, { new: true, runValidators: true }).populate('userId', 'name lastname email').lean().exec();
  }

  remove(id: string, organizationId: string) {
    return this.model.deleteOne({ _id: id, organizationId }).exec();
  }
}
