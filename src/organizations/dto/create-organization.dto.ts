import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';
import { PlanType } from '../schemas/organization.schema';

export class CreateOrganizationDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    slug: string;

    @IsEmail({}, { message: 'Ingresá un email válido' })
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    logoUrl?: string;

    @IsEnum(PlanType)
    @IsOptional()
    plan?: PlanType;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
