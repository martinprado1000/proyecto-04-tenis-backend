import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ timestamps: true })
export class SystemBranding extends Document {
  @Prop({ required: true, default: 'MatchPoint TC' })
  name: string

  @Prop()
  logoUrl?: string
}

export const SystemBrandingSchema = SchemaFactory.createForClass(SystemBranding)
