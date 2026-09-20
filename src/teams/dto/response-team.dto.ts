import { Expose, Transform } from 'class-transformer';
import { TipoEquipo } from '../enums/tipo-equipo.enum';

export class ResponseTeamDto {
  @Expose()
  @Transform(({ obj }) => (obj._id ? obj._id.toString() : obj.id))
  id: string;

  @Expose()
  name: string;

  @Expose()
  integrante1: any;

  @Expose()
  integrante2: any;

  @Expose()
  tipo: TipoEquipo;
}
