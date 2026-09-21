import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class ServeMetrics {
  @Prop({ default: 0 }) firstServeTotal: number;
  @Prop({ default: 0 }) firstServeIn: number;
  @Prop({ default: 0 }) secondServeTotal: number;
  @Prop({ default: 0 }) secondServeIn: number;
  @Prop({ default: 0 }) doubleFaults: number;
  @Prop({ default: 0 }) net: number;
  @Prop({ default: 0 }) long: number;
  @Prop({ default: 0 }) t: number;
  @Prop({ default: 0 }) body: number;
  @Prop({ default: 0 }) wide: number;
}

@Schema({ _id: false })
export class GroundstrokeMetrics {
  @Prop({ default: 0 }) total: number;
  @Prop({ default: 0 }) deep: number;
  @Prop({ default: 0 }) short: number;
  @Prop({ default: 0 }) winners: number;
  @Prop({ default: 0 }) errorsNet: number;
  @Prop({ default: 0 }) errorsLong: number;
  @Prop({ default: 0 }) forehandWinners: number;
  @Prop({ default: 0 }) backhandWinners: number;
}

@Schema({ _id: false })
export class NetPlayMetrics {
  @Prop({ default: 0 }) approaches: number;
  @Prop({ default: 0 }) won: number;
  @Prop({ default: 0 }) smashes: number;
  @Prop({ default: 0 }) smashesWon: number;
  @Prop({ default: 0 }) volleys: number;
  @Prop({ default: 0 }) volleysWon: number;
  @Prop({ default: 0 }) errors: number;
}

@Schema({ _id: false })
export class RallyMetrics {
  @Prop({ default: 0 }) totalRallies: number;
  @Prop({ default: 0 }) winners: number;
  @Prop({ default: 0 }) forcedErrors: number;
  @Prop({ default: 0 }) unforcedErrors: number;
  @Prop({ default: 0 }) breakPointsWon: number;
  @Prop({ default: 0 }) breakPointsLost: number;
}

@Schema({ timestamps: true })
export class SportsAnalysisSession extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: string;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  opponent?: string;

  @Prop({ trim: true, default: 'session' })
  type: 'session' | 'match';

  @Prop({ type: ServeMetrics, default: () => ({}) })
  serving: ServeMetrics;

  @Prop({ type: GroundstrokeMetrics, default: () => ({}) })
  groundstrokes: GroundstrokeMetrics;

  @Prop({ type: NetPlayMetrics, default: () => ({}) })
  netPlay: NetPlayMetrics;

  @Prop({ type: RallyMetrics, default: () => ({}) })
  rally: RallyMetrics;

  @Prop({ default: '' })
  notes: string;

  @Prop({ default: 0 })
  coachRating: number;
}

export const SportsAnalysisSessionSchema = SchemaFactory.createForClass(SportsAnalysisSession);
