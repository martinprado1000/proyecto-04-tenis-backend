import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { FormatoTorneo } from '../enums/formato-torneo.enum';

export class CreateTournamentDto {
  @ApiProperty({
    description: 'Nombre del torneo',
    example: 'Torneo de Primavera 2026',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del torneo es obligatorio' })
  name: string;

  @ApiProperty({
    description: 'Formato del torneo',
    enum: FormatoTorneo,
    example: FormatoTorneo.ROUND_ROBIN_SINGLE_MASCULINO,
  })
  @IsEnum(FormatoTorneo, { message: 'El formato del torneo seleccionado no es válido' })
  @IsNotEmpty({ message: 'El formato del torneo es obligatorio' })
  formato: FormatoTorneo;

  @ApiProperty({
    description: 'Fecha de inicio del torneo',
    example: '2026-09-01',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'La fecha de inicio debe ser una fecha válida' })
  fechaInicio?: Date;

  @ApiProperty({
    description: 'Fecha de finalización del torneo',
    example: '2026-09-30',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'La fecha de finalización debe ser una fecha válida' })
  fechaFin?: Date;

  @ApiProperty({
    description: 'IDs de jugadores inscriptos (para torneos Single)',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true, message: 'Cada elemento de jugadores debe ser un MongoID válido' })
  jugadores?: string[];

  @ApiProperty({
    description: 'IDs de jugadores excluidos de la selección, conservados para mostrar fechas canceladas',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  jugadoresExcluidos?: string[];

  @ApiProperty({
    description: 'IDs de equipos excluidos de la selección, conservados para mostrar fechas canceladas',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  equiposExcluidos?: string[];

  @ApiProperty({
    description: 'IDs de equipos inscriptos (para torneos Dobles)',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true, message: 'Cada elemento de equipos debe ser un MongoID válido' })
  equipos?: string[];

  @ApiProperty({
    description: 'Estado activo del torneo',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'El campo isActive debe ser un valor booleano' })
  isActive?: boolean;

  @ApiProperty({
    description: 'Fechas generadas del torneo (partidos)',
    required: false,
    type: [Object],
  })
  @IsOptional()
  fechas?: any[];

  @ApiProperty({
    description: 'Cantidad de sets por partido (3 o 5)',
    required: false,
    example: 3,
  })
  @IsOptional()
  @IsInt({ message: 'setsCount debe ser un número entero' })
  @Min(3, { message: 'setsCount mínimo es 3' })
  @Max(5, { message: 'setsCount máximo es 5' })
  setsCount?: number;
}
