import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { FormatoTorneo } from '../enums/formato-torneo.enum';
import { User } from 'src/users/schemas/user.schema';
import { Team } from 'src/teams/schemas/team.schema';
import { Organization } from 'src/organizations/schemas/organization.schema';

@Schema({
  timestamps: true,
})
export class Tournament extends Document {
  @ApiProperty({
    description: 'Nombre del torneo',
    example: 'Torneo de Primavera 2026',
  })
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @ApiProperty({
    description: 'Formato del torneo',
    enum: FormatoTorneo,
    example: FormatoTorneo.ROUND_ROBIN_SINGLE_MASCULINO,
  })
  @Prop({
    required: true,
    enum: FormatoTorneo,
  })
  formato: FormatoTorneo;

  @ApiProperty({
    description: 'Fecha de inicio del torneo',
    example: '2026-09-01',
    required: false,
  })
  @Prop({
    required: false,
    type: Date,
  })
  fechaInicio?: Date;

  @ApiProperty({
    description: 'Fecha de fin del torneo',
    example: '2026-09-30',
    required: false,
  })
  @Prop({
    required: false,
    type: Date,
  })
  fechaFin?: Date;

  @ApiProperty({
    description: 'Jugadores inscriptos para torneos Single',
    type: [String],
    required: false,
  })
  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: User.name }],
    default: [],
  })
  jugadores: User[];

  @ApiProperty({
    description: 'Equipos inscriptos para torneos Dobles',
    type: [String],
    required: false,
  })
  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: Team.name }],
    default: [],
  })
  equipos: Team[];

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: User.name, default: [] })
  jugadoresExcluidos: User[];

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: Team.name, default: [] })
  equiposExcluidos: Team[];

  @ApiProperty({
    description: 'Fechas (partidos) generadas para el torneo',
    required: false,
  })
  @Prop({
    type: [
      {
        jugadores: [{ type: MongooseSchema.Types.ObjectId, ref: User.name }],
        equipos: [{ type: MongooseSchema.Types.ObjectId, ref: Team.name }],
        fecha: { type: Date, required: false },
        sets: [
          {
            local: { type: Number, required: false },
            visitante: { type: Number, required: false },
            tieBreakLocal: { type: Number, required: false },
            tieBreakVisitante: { type: Number, required: false },
          },
        ],
        resultado: { type: String, required: false },
        jugado: { type: Boolean, default: false },
        round: { type: Number, required: false },
        thirdPlace: { type: Boolean, default: false, required: false },
        reemplazado1: { type: Boolean, default: false, required: false },
        reemplazado2: { type: Boolean, default: false, required: false },
        order: { type: Number, required: false },
      },
    ],
    default: [],
  })
  fechas?: any[];

  @ApiProperty({
    description: 'Cantidad de sets por partido (3 o 5)',
    example: 3,
    required: false,
  })
  @Prop({
    type: Number,
    default: 3,
  })
  setsCount?: number;

  @ApiProperty({ description: 'Organization that owns the tournament', required: false })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Organization.name, required: false, index: true })
  organizationId?: string;

  @ApiProperty({
    description: 'Indica si el torneo está activo',
    default: true,
  })
  @Prop({
    default: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha en la que el torneo fue eliminado (Soft Delete)',
    required: false,
  })
  @Prop({
    required: false,
    type: Date,
  })
  deletedAt?: Date;
}

export const TournamentSchema = SchemaFactory.createForClass(Tournament);
