import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export enum PlanType {
  FREE = 'FREE',
  PRO = 'PRO',
}

@Schema({ timestamps: true })
export class Organization extends Document {
  @ApiProperty({ description: 'Organization name', example: 'Club Rosario' })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty({ description: 'Unique slug', example: 'club-rosario' })
  @Prop({ required: true, trim: true, unique: true, index: true })
  slug: string;

  @ApiProperty({ description: 'Email de contacto de la organización', required: false, example: 'club@example.com' })
  @Prop({ required: false, trim: true, lowercase: true })
  email?: string;

  @ApiProperty({ description: 'Logo URL', required: false })
  @Prop({ required: false })
  logoUrl?: string;

  @ApiProperty({ description: 'Plan type', enum: PlanType, example: PlanType.FREE })
  @Prop({ required: true, enum: PlanType, default: PlanType.FREE })
  plan: PlanType;

  @ApiProperty({ description: 'Is active', required: false, default: true })
  @Prop({ required: false, default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Organización protegida contra eliminación', required: false, default: false })
  @Prop({ default: false })
  isProtected: boolean;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
