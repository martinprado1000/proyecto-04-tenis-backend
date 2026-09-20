import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { TipoEquipo } from '../enums/tipo-equipo.enum';

export class CreateTeamDto {
  @ApiProperty({
    description: 'Nombre del equipo',
    example: 'Los Halcones',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del equipo es obligatorio' })
  name: string;

  @ApiProperty({
    description: 'ID de Mongo del primer integrante',
    example: '67a1a6c23504ec3e184cc14a',
  })
  @IsMongoId({ message: 'El integrante 1 debe ser un ID de usuario válido' })
  @IsNotEmpty({ message: 'El integrante 1 es obligatorio' })
  integrante1: string;

  @ApiProperty({
    description: 'ID de Mongo del segundo integrante',
    example: '67a1a6c23504ec3e184cc14b',
  })
  @IsMongoId({ message: 'El integrante 2 debe ser un ID de usuario válido' })
  @IsNotEmpty({ message: 'El integrante 2 es obligatorio' })
  integrante2: string;

  @ApiProperty({
    description: 'Tipo de equipo',
    enum: TipoEquipo,
    example: TipoEquipo.MASCULINO,
  })
  @IsEnum(TipoEquipo, { message: 'El tipo de equipo debe ser Masculino, Femenino o Mixto' })
  @IsNotEmpty({ message: 'El tipo de equipo es obligatorio' })
  tipo: TipoEquipo;
}
