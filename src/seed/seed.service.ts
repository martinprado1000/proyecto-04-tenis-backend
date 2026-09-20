import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { initialData } from './data/seed-data';
import { bulkSeedUsers } from './data/bulk-seed-data';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { PlanType } from 'src/organizations/schemas/organization.schema';
import { Role, Sexo } from 'src/users/enums/role.enums';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Organization } from 'src/organizations/schemas/organization.schema';
import { User } from 'src/users/schemas/user.schema';
import { Tournament } from 'src/tournaments/schemas/tournament.schema';
import { FormatoTorneo } from 'src/tournaments/enums/formato-torneo.enum';
import { PlayerStatistics } from 'src/statistics/schemas/player-statistics.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
    @InjectModel(Tournament.name) private readonly tournamentModel: Model<Tournament>,
    @InjectModel(Organization.name) private readonly organizationModel: Model<Organization>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(PlayerStatistics.name) private readonly statisticsModel: Model<PlayerStatistics>,
  ) { }

  // Run seed.
  async runSeed() {
    try {
      const systemOrganization = await this.organizationModel.findOneAndUpdate(
        { slug: 'systemmp' },
        {
          $setOnInsert: {
            name: 'SystemMP',
            slug: 'systemmp',
            logoUrl: '',
            plan: PlanType.FREE,
            isActive: true,
            isProtected: true,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      ).exec();

      const seedUsers = JSON.parse(JSON.stringify(initialData.users));
      const results: any[] = [];

      for (const seedUser of seedUsers) {
        const roles = Array.isArray(seedUser.roles) ? seedUser.roles : [seedUser.roles];
        const existingUser = await this.userModel.findOne({ email: seedUser.email }).exec();
        const payload = {
          name: seedUser.name,
          lastname: seedUser.lastname,
          email: seedUser.email,
          password: await bcrypt.hash(seedUser.password, 10),
          roles,
          isActive: seedUser.isActive,
          sexo: seedUser.sexo,
          organizationId: systemOrganization._id,
        };

        const user = existingUser
          ? await this.userModel.findByIdAndUpdate(existingUser._id, payload, { new: true }).exec()
          : await this.userModel.create(payload);
        results.push(user);
      }

      return {
        message: 'Seed ejecutado correctamente',
        organizacion: systemOrganization.slug,
        usuariosCreados: results.length,
        usuarios: results.map((user) => ({ id: user?._id, email: user?.email, roles: user?.roles })),
      };
    } catch (error) {
      console.error('Seed error:', error?.stack || error);
      throw new InternalServerErrorException('Please check server logs');
    }
  }

  async runBulkUpload() {
    const demoSlug = 'demo';
    let organization = await this.organizationModel.findOne({ slug: demoSlug }).exec();
    if (!organization) {
      organization = await this.organizationModel.create({ name: 'Demo', slug: demoSlug, logoUrl: '', plan: PlanType.FREE, isActive: true, isProtected: true });
    } else if (!organization.isProtected) {
      organization.isProtected = true;
      await organization.save();
    }

    if (organization.slug !== demoSlug) {
      throw new InternalServerErrorException('La carga bulk solo puede ejecutarse sobre la organización demo.');
    }

    const demoOrganizationId = organization._id;

    // Limpia únicamente residuos de cargas bulk anteriores fuera de Demo.
    // No toca los usuarios de seed del sistema ni datos normales de otras organizaciones.
    const bulkUsersOutsideDemo = await this.userModel.find({
      email: { $regex: /^bulk\..+@(?:systemmp\.test|demo\.test)$/i },
      organizationId: { $ne: demoOrganizationId },
    }).select('_id').lean().exec();
    const bulkUserIdsOutsideDemo = bulkUsersOutsideDemo.map((user) => user._id);
    if (bulkUserIdsOutsideDemo.length > 0) {
      await this.tournamentModel.deleteMany({
        $or: [
          { organizationId: { $ne: demoOrganizationId }, name: { $regex: /^Histórico Demo /i } },
          { 'fechas.jugadores': { $in: bulkUserIdsOutsideDemo } },
        ],
      });
      await this.statisticsModel.deleteMany({ userId: { $in: bulkUserIdsOutsideDemo } });
      await this.userModel.deleteMany({ _id: { $in: bulkUserIdsOutsideDemo } });
    }

    await this.tournamentModel.deleteMany({ organizationId: demoOrganizationId });
    await this.statisticsModel.deleteMany({ organizationId: demoOrganizationId });
    await this.userModel.deleteMany({ organizationId: demoOrganizationId });
    const adminPassword = await bcrypt.hash('Test123*', 10);
    await this.userModel.create({ name: 'Demo', lastname: 'Administrador', email: 'demo@gmail.com', password: adminPassword, roles: [Role.ADMIN], isActive: true, sexo: Sexo.MASCULINO, telefono: '+5493415550000', organizationId: organization._id });
    const users: any[] = [];
    const password = await bcrypt.hash('Test123*', 10);
    for (let i = 0; i < bulkSeedUsers.length; i++) {
      const seedUser = bulkSeedUsers[i];
      const email = `bulk.${Date.now()}.${i}@demo.test`;
      const user = await this.userModel.create({
        ...seedUser,
        email,
        password,
        roles: [Role.USER],
        isActive: true,
        organizationId: demoOrganizationId,
      });
      users.push(user);
    }
    const ids = users.map((u) => u._id);
    const dates = [
      { fecha: new Date('2023-02-15'), sets: [{ local: 6, visitante: 3 }, { local: 6, visitante: 4 }], jugado: true, resultado: '6-3 / 6-4' },
      { fecha: new Date('2024-06-20'), sets: [{ local: 4, visitante: 6 }, { local: 6, visitante: 3 }, { local: 7, visitante: 5 }], jugado: true, resultado: '4-6 / 6-3 / 7-5' },
      { fecha: new Date('2025-09-10'), sets: [{ local: 6, visitante: 2 }, { local: 3, visitante: 6 }, { local: 6, visitante: 7, tieBreakLocal: 5, tieBreakVisitante: 7 }], jugado: true, resultado: '6-2 / 3-6 / 6-7' },
      { fecha: new Date('2026-01-25'), sets: [{ local: 6, visitante: 1 }, { local: 6, visitante: 2 }], jugado: true, resultado: '6-1 / 6-2' },
    ];
    for (let t = 0; t < 6; t++) {
      const start = (t * 4) % ids.length;
      const jugadores = [0, 1, 2, 3, 4, 5].map((offset) => ids[(start + offset) % ids.length]);
      if (t === 5) jugadores[0] = ids[0];
      const fechas = jugadores.map((id, index) => ({
        jugadores: [id, jugadores[(index + 1) % jugadores.length]],
        ...JSON.parse(JSON.stringify(dates[t % dates.length])),
        round: 1,
        order: index + 1,
      }));
      await this.tournamentModel.create({ name: `Histórico Demo ${t + 1}`, formato: FormatoTorneo.ROUND_ROBIN_SINGLE_MASCULINO, jugadores, fechas, setsCount: 3, organizationId: demoOrganizationId, isActive: true });
    }
    const torneosDemo = await this.tournamentModel.countDocuments({ organizationId: demoOrganizationId });
    const usuariosDemo = await this.userModel.countDocuments({ organizationId: demoOrganizationId, roles: Role.USER });
    return { message: 'Carga bulk completada', administrador: 'demo@gmail.com', usuariosCreados: users.length, usuariosDemo, torneosCreados: 6, torneosDemo };
  }


}
