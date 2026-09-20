import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { User } from 'src/users/schemas/user.schema';
import { Role } from 'src/users/enums/role.enums';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user as User;
    if (!user) throw new ForbiddenException('Usuario no autenticado');
    if (!Array.isArray(user.roles)) throw new ForbiddenException('Acceso denegado');
    if (user.roles.includes(Role.SUPERADMIN)) return true;
    throw new ForbiddenException('Se requiere rol SUPERADMIN');
  }
}
