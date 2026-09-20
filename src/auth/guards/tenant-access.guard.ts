import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from 'src/users/enums/role.enums';

@Injectable()
export class TenantAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (!req.organizationId) return true;
    const user = req.user;
    if (!user) return false;
    if (user.roles?.includes(Role.SUPERADMIN)) return true;
    if (String(user.organizationId || '') !== String(req.organizationId)) {
      throw new ForbiddenException('No tenés acceso a esta organización.');
    }
    return true;
  }
}
