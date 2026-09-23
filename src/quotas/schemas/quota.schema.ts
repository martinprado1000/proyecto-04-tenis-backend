import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class QuotaPaymentPlan {
  @Prop({ default: false }) enabled: boolean;
  @Prop({ default: 1, min: 1 }) installments: number;
  @Prop({ type: [Date], default: [] }) dueDates: Date[];
  @Prop({ default: '' }) notes: string;
}

@Schema({ timestamps: true })
export class Quota extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: string;

  @Prop({ required: true, trim: true })
  period: string;

  @Prop({ required: true, min: 2000 })
  year: number;

  @Prop({ required: true, min: 1, max: 12 })
  month: number;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, enum: ['PENDING', 'PAID', 'OVERDUE', 'PARTIAL'], default: 'PENDING' })
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';

  @Prop({ type: QuotaPaymentPlan, default: () => ({}) })
  paymentPlan: QuotaPaymentPlan;

  @Prop({ trim: true, default: '' })
  notes: string;
}

export const QuotaSchema = SchemaFactory.createForClass(Quota);
QuotaSchema.index({ organizationId: 1, userId: 1, year: 1, month: 1 }, { unique: true });
