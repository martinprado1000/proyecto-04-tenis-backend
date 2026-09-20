import { Expose, Transform } from 'class-transformer';
import { Role, Sexo } from 'src/users/enums/role.enums';

export class ResponseUserDto {

  @Expose()
  @Transform(({ obj }) => (obj._id ? obj._id.toString() : obj.id))
  id: string;

  @Expose()
  name: string;

  @Expose()
  lastname: string;

  @Expose()
  email: string;

  @Expose()
  roles: Role;

  @Expose()
  isActive: boolean;

  @Expose()
  sexo?: Sexo;

  @Expose()
  birthdate?: Date;

  @Expose()
  dni?: number;

  @Expose()
  telefono?: string;

  @Expose()
  categoria?: string;

  @Expose()
  @Transform(({ obj }) => obj.organizationId?._id?.toString() || obj.organizationId?.toString() || null)
  organizationId?: string;

}
