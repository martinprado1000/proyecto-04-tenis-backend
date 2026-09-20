import { IsIn, IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class StatisticsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @IsOptional()
  @IsMongoId()
  tournamentId?: string;

  @IsOptional()
  @IsIn(['singles', 'dobles'])
  tipo?: 'singles' | 'dobles';
}
