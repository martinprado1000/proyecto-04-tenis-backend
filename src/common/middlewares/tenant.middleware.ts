import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { OrganizationsService } from 'src/organizations/organizations.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);
  constructor(private readonly orgService: OrganizationsService) {}

  async use(req: Request & { organizationId?: string }, res: Response, next: NextFunction) {
    try {
      const header = (req.headers['x-tenant-slug'] as string) || '';
      const paramSlug = (req.params && (req.params as any).tenantSlug) || '';
      const slug = (header || paramSlug || '').toString();
      if (!slug) {
        // no tenant provided — allow public reads
        return next();
      }

      const org = await this.orgService.findBySlug(slug);
      if (!org || !org.isActive) {
        this.logger.warn(`Tenant not found or inactive: ${slug}`);
        // attach nothing; controllers should check presence when needed
        return next();
      }

      req.organizationId = org._id?.toString();
      return next();
    } catch (err) {
      this.logger.error('Tenant middleware error', err as any);
      return next();
    }
  }
}
