import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsOptional, IsString } from 'class-validator';

export class AssignJugadoresDto {
  @ApiProperty({
    description: 'Array de IDs de los jugadores a asignar en el torneo Single',
    type: [String],
  })
  @IsArray({ message: 'jugadores debe ser un arreglo de IDs' })
  @IsMongoId({ each: true, message: 'Cada elemento de jugadores debe ser un MongoID válido' })
  jugadores: string[];

  @IsOptional()
  @IsString()
  modo?: string;

  @IsOptional()
  @IsMongoId()
  reemplazarId?: string;

  @IsOptional()
  @IsMongoId()
  nuevoId?: string;
}

export class AssignEquiposDto {
  @ApiProperty({
    description: 'Array de IDs de los equipos a asignar en el torneo Dobles',
    type: [String],
  })
  @IsArray({ message: 'equipos debe ser un arreglo de IDs' })
  @IsMongoId({ each: true, message: 'Cada elemento de equipos debe ser un MongoID válido' })
  equipos: string[];

  @IsOptional()
  @IsString()
  modo?: string;

  @IsOptional()
  @IsMongoId()
  reemplazarId?: string;

  @IsOptional()
  @IsMongoId()
  nuevoId?: string;
}
