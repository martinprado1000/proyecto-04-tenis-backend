import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class ServeMetricsDto {
  @IsOptional() @IsNumber() firstServeTotal?: number;
  @IsOptional() @IsNumber() firstServeIn?: number;
  @IsOptional() @IsNumber() secondServeTotal?: number;
  @IsOptional() @IsNumber() secondServeIn?: number;
  @IsOptional() @IsNumber() doubleFaults?: number;
  @IsOptional() @IsNumber() net?: number;
  @IsOptional() @IsNumber() long?: number;
  @IsOptional() @IsNumber() t?: number;
  @IsOptional() @IsNumber() body?: number;
  @IsOptional() @IsNumber() wide?: number;
}

class GroundstrokeMetricsDto {
  @IsOptional() @IsNumber() total?: number;
  @IsOptional() @IsNumber() deep?: number;
  @IsOptional() @IsNumber() short?: number;
  @IsOptional() @IsNumber() winners?: number;
  @IsOptional() @IsNumber() errorsNet?: number;
  @IsOptional() @IsNumber() errorsLong?: number;
  @IsOptional() @IsNumber() forehandWinners?: number;
  @IsOptional() @IsNumber() backhandWinners?: number;
}

class NetPlayMetricsDto {
  @IsOptional() @IsNumber() approaches?: number;
  @IsOptional() @IsNumber() won?: number;
  @IsOptional() @IsNumber() smashes?: number;
  @IsOptional() @IsNumber() smashesWon?: number;
  @IsOptional() @IsNumber() volleys?: number;
  @IsOptional() @IsNumber() volleysWon?: number;
  @IsOptional() @IsNumber() errors?: number;
}

class RallyMetricsDto {
  @IsOptional() @IsNumber() totalRallies?: number;
  @IsOptional() @IsNumber() winners?: number;
  @IsOptional() @IsNumber() forcedErrors?: number;
  @IsOptional() @IsNumber() unforcedErrors?: number;
  @IsOptional() @IsNumber() breakPointsWon?: number;
  @IsOptional() @IsNumber() breakPointsLost?: number;
}

export class CreateSportsAnalysisDto {
  @IsString() userId: string;

  @IsOptional() @IsString() opponent?: string;

  @IsDateString() date: string;

  @IsString() title: string;

  @IsOptional() @IsEnum(['session', 'match']) type?: 'session' | 'match';

  @IsOptional() @ValidateNested() @Type(() => ServeMetricsDto) serving?: ServeMetricsDto;

  @IsOptional() @ValidateNested() @Type(() => GroundstrokeMetricsDto) groundstrokes?: GroundstrokeMetricsDto;

  @IsOptional() @ValidateNested() @Type(() => NetPlayMetricsDto) netPlay?: NetPlayMetricsDto;

  @IsOptional() @ValidateNested() @Type(() => RallyMetricsDto) rally?: RallyMetricsDto;

  @IsOptional() @IsString() notes?: string;

  @IsOptional() @IsNumber() @Min(0) coachRating?: number;
}
