import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/schemas/user.schema';
import { Organization } from 'src/organizations/schemas/organization.schema';
import { TipoEquipo } from '../enums/tipo-equipo.enum';

@Schema({
  timestamps: true,
})
export class Team extends Document {
  @ApiProperty({
    description: 'Nombre del equipo',
    example: 'Los Halcones',
  })
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @ApiProperty({
    description: 'ID o documento del primer integrante',
    type: String,
  })
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  integrante1: User;

  @ApiProperty({
    description: 'ID o documento del segundo integrante',
    type: String,
  })
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  integrante2: User;

  @ApiProperty({
    description: 'Tipo de equipo',
    enum: TipoEquipo,
    example: TipoEquipo.MASCULINO,
  })
  @Prop({
    required: true,
    enum: TipoEquipo,
  })
  tipo: TipoEquipo;

  @ApiProperty({ description: 'Organization that owns the team', required: false })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: Organization.name, required: false, index: true })
  organizationId?: string;
}

export const TeamSchema = SchemaFactory.createForClass(Team);
