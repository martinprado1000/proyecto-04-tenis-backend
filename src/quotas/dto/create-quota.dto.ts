import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

class PaymentPlanDto {
  @IsOptional() enabled?: boolean;
  @IsOptional() @IsInt() @Min(1) installments?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) dueDates?: string[];
  @IsOptional() @IsString() notes?: string;
}

export class CreateQuotaDto {
  @IsString() userId: string;
  @IsOptional() @IsString() period?: string;
  @IsInt() @Min(2000) year: number;
  @IsInt() @Min(1) @Max(12) month: number;
  @IsNumber() @Min(0) amount: number;
  @IsEnum(['PENDING', 'PAID', 'OVERDUE', 'PARTIAL']) status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
  @IsOptional() @ValidateNested() @Type(() => PaymentPlanDto) paymentPlan?: PaymentPlanDto;
  @IsOptional() @IsString() notes?: string;
}
