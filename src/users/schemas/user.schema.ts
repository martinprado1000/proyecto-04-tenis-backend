import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Role, Sexo } from '../enums/role.enums';
import { Organization } from 'src/organizations/schemas/organization.schema';
import { ApiProperty } from '@nestjs/swagger';

@Schema({
  timestamps: true,
})
export class User extends Document {
  @ApiProperty({
    description: 'User name',
    example: 'Richard',
    required: true,
  })
  @Prop({
    trim: true,
    required: true,
    set: (value: string) => {
      if (!value) return value;
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    },
  })
  name: string;

  @ApiProperty({
    description: 'User lastname',
    example: 'Kendy',
    required: true,
  })
  @Prop({
    trim: true,
    required: true,
    set: (value: string) => {
      if (!value) return value;
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    },
  })
  lastname: string;

  @ApiProperty({
    description: 'User email',
    example: 'richard@gmail.com',
    uniqueItems: true,
    required: true,
  })
  @Prop({
    required: true,
    index: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'Test123##',
    required: true,
  })
  @Prop({
    required: true,
    trim: true,
  })
  password: string;

  @ApiProperty({
    description: 'User role',
    example: ['USER', 'OPERATOR', 'ADMIN', 'SUPERADMIN'],
    enum: Role,
    default: Role.USER,
    required: false,
  })
  @Prop({
    required: true,
    trim: true,
    default: Role.USER,
    uppercase: true,
  })
  roles: Role[];

  @ApiProperty({
    description: 'User is active?',
    example: [true, false],
    default: true,
    required: false,
  })
  @Prop({
    required: false,
    default: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Indica si el usuario es cliente y debe figurar en la gestión de cuotas',
    example: false,
    default: false,
    required: false,
  })
  @Prop({
    required: false,
    default: false,
  })
  isClient?: boolean;

  @ApiProperty({
    description: 'Sexo',
    enum: Sexo,
    required: false,
  })
  @Prop({
    required: true,
    enum: Sexo,
  })
  sexo: Sexo;


  @ApiProperty({
    description: 'Categoría deportiva del usuario',
    enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    required: false,
  })
  @Prop({
    required: false,
    enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    trim: true,
  })
  categoria?: string;

  @ApiProperty({ description: 'Organization association (for multi-tenant)', required: false })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: Organization.name }], default: [] , index: true })
  organizations?: Organization[];

  @ApiProperty({ description: 'Primary organization for ADMIN users', required: false })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Organization.name, required: false, index: true })
  organizationId?: string;

  @ApiProperty({
    description: 'Birthdate',
    type: String,
    required: false,
  })
  @Prop({
    required: false,
    type: Date,
  })
  birthdate?: Date;

  @ApiProperty({
    description: 'Dni number',
    type: Number,
    required: false,
  })
  @Prop({
    required: false,
    type: Number,
  })
  dni?: number;

  @ApiProperty({ description: 'Número telefónico en formato internacional', required: false, example: '+5493415551234' })
  @Prop({ required: false, trim: true })
  telefono?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
