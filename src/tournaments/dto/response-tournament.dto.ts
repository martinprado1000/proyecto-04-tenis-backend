import { Expose, Transform } from 'class-transformer';
import { FormatoTorneo } from '../enums/formato-torneo.enum';

export class ResponseTournamentDto {
  @Expose()
  @Transform(({ obj }) => (obj._id ? obj._id.toString() : obj.id))
  id: string;

  @Expose()
  name: string;

  @Expose()
  formato: FormatoTorneo;

  @Expose()
  fechaInicio?: Date;

  @Expose()
  fechaFin?: Date;

  @Expose()
  jugadores: any[];

  @Expose()
  equipos: any[];

  @Expose()
  setsCount?: number;

  @Expose()
  isActive: boolean;
}
