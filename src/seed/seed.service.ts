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
import { SportsAnalysisSession } from 'src/sportsAnalysis/sportsAnalysis.schema';
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
    @InjectModel(SportsAnalysisSession.name) private readonly sportsAnalysisModel: Model<SportsAnalysisSession>,
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
      await this.sportsAnalysisModel.deleteMany({ userId: { $in: bulkUserIdsOutsideDemo } });
      await this.userModel.deleteMany({ _id: { $in: bulkUserIdsOutsideDemo } });
    }

    await this.tournamentModel.deleteMany({ organizationId: demoOrganizationId });
    await this.statisticsModel.deleteMany({ organizationId: demoOrganizationId });
    await this.sportsAnalysisModel.deleteMany({ organizationId: demoOrganizationId });
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
    const sessionsToCreate: any[] = [];
    for (const [userIndex, user] of users.entries()) {
      const sessionDates = [new Date('2024-05-12'), new Date('2025-02-18')];
      sessionDates.forEach((date, index) => {
        const profile = userIndex + 1;
        const progress = index * 2;
        const firstServeTotal = 34 + ((profile * 7) % 17) + index * 5;
        const firstServeIn = Math.min(firstServeTotal, 18 + ((profile * 5) % 15) + progress * 3);
        const secondServeTotal = 14 + ((profile * 3) % 9);
        const secondServeIn = Math.min(secondServeTotal, 7 + ((profile * 2) % 8) + index);
        const groundstrokesTotal = 42 + ((profile * 11) % 31) + index * 8;
        const deepGroundstrokes = Math.min(groundstrokesTotal, 16 + ((profile * 7) % 23) + index * 4);
        const netApproaches = 6 + ((profile * 5) % 12) + index * 2;
        const netWon = Math.min(netApproaches, 2 + ((profile * 3) % 8) + index);
        const totalRallies = 34 + ((profile * 13) % 37) + index * 7;
        sessionsToCreate.push({
          userId: user._id,
          organizationId: demoOrganizationId,
          date,
          title: index === 0 ? 'Sesión de preparación' : 'Análisis de rendimiento',
          opponent: index === 1 ? 'Rival demo' : undefined,
          type: 'session',
          serving: {
            firstServeTotal,
            firstServeIn,
            secondServeTotal,
            secondServeIn,
            doubleFaults: Math.max(0, 4 - ((profile + index) % 4)),
            net: 1 + ((profile + index) % 5),
            long: 2 + ((profile * 2 + index) % 6),
            t: 3 + ((profile * 3 + index) % 8),
            body: 2 + ((profile * 5 + index) % 7),
            wide: 1 + ((profile * 7 + index) % 6),
          },
          groundstrokes: {
            total: groundstrokesTotal,
            deep: deepGroundstrokes,
            short: 3 + ((profile * 3 + index) % 9),
            winners: 5 + ((profile * 5 + index * 2) % 15),
            errorsNet: 2 + ((profile + index) % 6),
            errorsLong: 2 + ((profile * 2 + index) % 7),
            forehandWinners: 3 + ((profile * 7 + index) % 12),
            backhandWinners: 2 + ((profile * 11 + index) % 10),
          },
          netPlay: {
            approaches: netApproaches,
            won: netWon,
            smashes: 1 + ((profile + index) % 5),
            smashesWon: 1 + ((profile * 2 + index) % 4),
            volleys: 3 + ((profile * 3 + index) % 10),
            volleysWon: 1 + ((profile * 5 + index) % 8),
            errors: 1 + ((profile * 7 + index) % 5),
          },
          rally: {
            totalRallies,
            winners: 6 + ((profile * 7 + index * 2) % 18),
            forcedErrors: 3 + ((profile * 5 + index) % 12),
            unforcedErrors: 3 + ((profile * 11 + index) % 13),
            breakPointsWon: 1 + ((profile * 3 + index) % 6),
            breakPointsLost: 1 + ((profile * 5 + index) % 5),
          },
          notes: index === 0 ? `Trabajo personalizado de servicio y golpes de fondo para perfil ${profile}.` : `Seguimiento de presión y juego de red del perfil ${profile}.`,
          coachRating: 5 + ((profile + index * 2) % 6),
        });
      });
    }
    if (sessionsToCreate.length > 0) {
      await this.sportsAnalysisModel.insertMany(sessionsToCreate);
    }

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
        round: index + 1,
        order: index + 1,
      }));
      await this.tournamentModel.create({ name: `Histórico Demo ${t + 1}`, formato: FormatoTorneo.ROUND_ROBIN_SINGLE_MASCULINO, jugadores, fechas, setsCount: 3, organizationId: demoOrganizationId, isActive: true });
    }
    const torneosDemo = await this.tournamentModel.countDocuments({ organizationId: demoOrganizationId });
    const usuariosDemo = await this.userModel.countDocuments({ organizationId: demoOrganizationId, roles: Role.USER });
    const sesionesAnalisisDemo = await this.sportsAnalysisModel.countDocuments({ organizationId: demoOrganizationId });
    return { message: 'Carga bulk completada', administrador: 'demo@gmail.com', usuariosCreados: users.length, usuariosDemo, torneosCreados: 6, torneosDemo, sesionesAnalisisCreadas: sesionesAnalisisDemo };
  }


}
