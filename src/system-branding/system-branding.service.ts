import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { SystemBranding } from './system-branding.schema'

const DEFAULT_BRANDING = { name: 'MatchPoint TC', logoUrl: '' }

@Injectable()
export class SystemBrandingService {
  constructor(@InjectModel(SystemBranding.name) private readonly model: Model<SystemBranding>) {}

  async get() {
    const branding = await this.model.findOne().lean().exec()
    return branding || DEFAULT_BRANDING
  }

  async update(payload: { name?: string; logoUrl?: string }) {
    return this.model.findOneAndUpdate(
      {},
      { name: payload.name?.trim() || DEFAULT_BRANDING.name, logoUrl: payload.logoUrl || '' },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean().exec()
  }
}
