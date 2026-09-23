import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { CreateQuotaDto } from './dto/create-quota.dto';
import { QuotasRepository } from './quotas.repository';

export const QUOTA_MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

@Injectable()
export class QuotasService {
  constructor(private readonly repository: QuotasRepository, private readonly usersService: UsersService) {}

  async findMatrix(organizationId: string | undefined, year: number) {
    const [users, quotas] = await Promise.all([
      this.usersService.findAllActiveUsersResponse({ limit: 1000, offset: 0 } as any, organizationId, true),
      this.repository.findAll(organizationId, year),
    ]);
    return { year, months: QUOTA_MONTHS, students: users, quotas };
  }

  async create(organizationId: string, dto: CreateQuotaDto) {
    const user = await this.usersService.findOne(dto.userId);
    if (!user.isClient) throw new BadRequestException('Solo se pueden registrar cuotas para usuarios marcados como clientes.');
    if (String(user.organizationId || '') !== String(organizationId)) throw new BadRequestException('El alumno no pertenece a esta organización.');
    return this.repository.create(this.normalize(dto, organizationId));
  }

  async update(id: string, organizationId: string, dto: Partial<CreateQuotaDto>) {
    const normalized = this.normalize(dto, organizationId, true);
    const updated = await this.repository.update(id, organizationId, normalized);
    if (!updated) throw new NotFoundException('Cuota no encontrada.');
    return updated;
  }

  async remove(id: string, organizationId: string) {
    const result = await this.repository.remove(id, organizationId);
    if (!result.deletedCount) throw new NotFoundException('Cuota no encontrada.');
    return { deleted: true };
  }

  private normalize(dto: Partial<CreateQuotaDto>, organizationId: string, partial = false) {
    const normalized: any = { ...dto, organizationId };
    if (dto.year !== undefined) normalized.year = Number(dto.year);
    if (dto.month !== undefined) {
      normalized.month = Number(dto.month);
      normalized.period = dto.period || `${QUOTA_MONTHS[normalized.month - 1]} ${normalized.year || new Date().getFullYear()}`;
    }
    if (dto.paymentPlan !== undefined) {
      const plan = dto.paymentPlan || {};
      normalized.paymentPlan = {
        enabled: Boolean(plan.enabled),
        installments: Number(plan.installments) || 1,
        dueDates: (plan.dueDates || []).map((date) => new Date(date)),
        notes: plan.notes || '',
      };
    } else if (!partial) {
      normalized.paymentPlan = { enabled: false, installments: 1, dueDates: [], notes: '' };
    }
    return normalized;
  }
}
