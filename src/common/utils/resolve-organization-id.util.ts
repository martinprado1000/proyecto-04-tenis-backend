import { Role } from 'src/users/enums/role.enums';

type RequestWithOrg = { organizationId?: string };
type UserWithOrg = { organizationId?: string; roles?: Role | Role[] | undefined };

export function resolveOrganizationId(
  req: RequestWithOrg,
  user?: UserWithOrg,
): string | undefined {
  if (req.organizationId) return req.organizationId;

  if (user?.roles?.includes(Role.SUPERADMIN)) {
    return undefined;
  }

  return user?.organizationId?.toString();
}
