import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class StatisticsSummary {
  @Prop({ default: 0 }) matchesPlayed: number;
  @Prop({ default: 0 }) matchesWon: number;
  @Prop({ default: 0 }) matchesLost: number;
  @Prop({ default: 0 }) setsWon: number;
  @Prop({ default: 0 }) setsLost: number;
  @Prop({ default: 0 }) gamesWon: number;
  @Prop({ default: 0 }) gamesLost: number;
  @Prop({ default: 0 }) tieBreaksWon: number;
  @Prop({ default: 0 }) tieBreaksLost: number;
  @Prop({ default: 0 }) tournamentsPlayed: number;
  @Prop({ default: 0 }) tournamentsWon: number;
  @Prop({ default: 0 }) finalsPlayed: number;
  @Prop({ default: 0 }) winRate: number;
}

@Schema({ _id: false })
export class TournamentStatistics {
  @Prop({ type: MongooseSchema.Types.ObjectId }) tournamentId: string;
  @Prop() tournamentName: string;
  @Prop() formato: string;
  @Prop({ enum: ['singles', 'dobles'] }) tipo: string;
  @Prop({ default: 0 }) matchesPlayed: number;
  @Prop({ default: 0 }) matchesWon: number;
  @Prop({ default: 0 }) matchesLost: number;
  @Prop({ default: 0 }) setsWon: number;
  @Prop({ default: 0 }) setsLost: number;
  @Prop({ default: 0 }) gamesWon: number;
  @Prop({ default: 0 }) gamesLost: number;
  @Prop({ default: 0 }) points: number;
  @Prop() position?: number;
  @Prop() result?: string;
}

@Schema({ _id: false })
export class MonthlyStatistics {
  @Prop() year: number;
  @Prop() month: number;
  @Prop({ default: 0 }) matchesPlayed: number;
  @Prop({ default: 0 }) matchesWon: number;
  @Prop({ default: 0 }) matchesLost: number;
  @Prop({ default: 0 }) setsWon: number;
  @Prop({ default: 0 }) setsLost: number;
  @Prop({ default: 0 }) gamesWon: number;
  @Prop({ default: 0 }) gamesLost: number;
}

@Schema({ timestamps: true })
export class PlayerStatistics extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: string;

  @Prop({ type: StatisticsSummary, default: () => ({}) })
  summary: StatisticsSummary;

  @Prop({ type: [TournamentStatistics], default: [] })
  byTournament: TournamentStatistics[];

  @Prop({ type: [MonthlyStatistics], default: [] })
  byMonth: MonthlyStatistics[];
}

export const PlayerStatisticsSchema = SchemaFactory.createForClass(PlayerStatistics);
PlayerStatisticsSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
