import { Injectable, NotFoundException } from '@nestjs/common';
import { SportsAnalysisRepository } from './sportsAnalysis.repository';

@Injectable()
export class SportsAnalysisService {
  constructor(private readonly repository: SportsAnalysisRepository) {}

  async create(payload: any) {
    if (!payload.userId || !payload.organizationId) {
      throw new NotFoundException('Faltan datos del usuario o la organización.');
    }

    const session = {
      ...payload,
      type: payload.type || 'session',
      date: payload.date ? new Date(payload.date) : new Date(),
      serving: payload.serving || {},
      groundstrokes: payload.groundstrokes || {},
      netPlay: payload.netPlay || {},
      rally: payload.rally || {},
      notes: payload.notes || '',
      coachRating: payload.coachRating || 0,
    };

    return this.repository.create(session);
  }

  async getSummary(userId: string, organizationId: string) {
    const sessions = await this.repository.findByUser(userId, organizationId);

    if (!sessions.length) {
      return {
        average: this.buildEmptyAverage(),
        overview: this.buildEmptyOverview(),
        sessions: [],
        chartData: [],
      };
    }

    const average = this.calculateAverage(sessions);
    return {
      average,
      overview: this.buildOverview(average),
      sessions,
      chartData: this.buildChartData(sessions),
    };
  }

  async update(id: string, userId: string, organizationId: string, payload: any) {
    const updated = await this.repository.updateById(id, userId, organizationId, {
      ...payload,
      date: payload.date ? new Date(payload.date) : undefined,
    });
    if (!updated) throw new NotFoundException('Sesión no encontrada.');
    return updated;
  }

  async remove(id: string, userId: string, organizationId: string) {
    const result = await this.repository.deleteById(id, userId, organizationId);
    if (!result.deletedCount) throw new NotFoundException('Sesión no encontrada.');
    return { deleted: true };
  }

  private buildEmptyAverage() {
    return {
      firstServeIn: 0,
      secondServeIn: 0,
      firstServePoints: 0,
      secondServePoints: 0,
      deepGroundstrokes: 0,
      winners: 0,
      errorsLong: 0,
      errorsNet: 0,
      netWinRate: 0,
      rallyWinRate: 0,
      coachRating: 0,
    };
  }

  private buildEmptyOverview() {
    return {
      trainingSessions: 0,
      matches: 0,
      avgCoachRating: 0,
      trend: 'stable',
    };
  }

  private calculateAverage(sessions: any[]) {
    const totals = sessions.reduce(
      (acc, session) => {
        const serving = session.serving || {};
        const groundstrokes = session.groundstrokes || {};
        const netPlay = session.netPlay || {};
        const rally = session.rally || {};

        const firstServeTotal = Number(serving.firstServeTotal || 0);
        const firstServeIn = Number(serving.firstServeIn || 0);
        const secondServeTotal = Number(serving.secondServeTotal || 0);
        const secondServeIn = Number(serving.secondServeIn || 0);

        acc.firstServeIn += firstServeTotal ? (firstServeIn / firstServeTotal) * 100 : 0;
        acc.secondServeIn += secondServeTotal ? (secondServeIn / secondServeTotal) * 100 : 0;

        acc.deepGroundstrokes += Number(groundstrokes.deep || 0);
        acc.winners += Number(groundstrokes.winners || 0) + Number(rally.winners || 0);
        acc.errorsLong += Number(groundstrokes.errorsLong || 0) + Number(serving.long || 0);
        acc.errorsNet += Number(groundstrokes.errorsNet || 0) + Number(netPlay.errors || 0);
        acc.netWins += Number(netPlay.won || 0);
        acc.netAttempts += Number(netPlay.approaches || 0);
        acc.rallyWins += Number(rally.winners || 0);
        acc.rallyAttempts += Number(rally.totalRallies || 0);
        acc.coachRating += Number(session.coachRating || 0);
        acc.sessions += 1;
        return acc;
      },
      {
        firstServeIn: 0,
        secondServeIn: 0,
        deepGroundstrokes: 0,
        winners: 0,
        errorsLong: 0,
        errorsNet: 0,
        netWins: 0,
        netAttempts: 0,
        rallyWins: 0,
        rallyAttempts: 0,
        coachRating: 0,
        sessions: 0,
      },
    );

    const sessionsCount = Math.max(totals.sessions, 1);

    return {
      firstServeIn: Number(((totals.firstServeIn / sessionsCount) || 0).toFixed(1)),
      secondServeIn: Number(((totals.secondServeIn / sessionsCount) || 0).toFixed(1)),
      deepGroundstrokes: Number(((totals.deepGroundstrokes / sessionsCount) || 0).toFixed(1)),
      winners: Number((totals.winners / sessionsCount).toFixed(1)),
      errorsLong: Number((totals.errorsLong / sessionsCount).toFixed(1)),
      errorsNet: Number((totals.errorsNet / sessionsCount).toFixed(1)),
      netWinRate: totals.netAttempts ? Number(((totals.netWins / totals.netAttempts) * 100).toFixed(1)) : 0,
      rallyWinRate: totals.rallyAttempts ? Number(((totals.rallyWins / totals.rallyAttempts) * 100).toFixed(1)) : 0,
      coachRating: Number((totals.coachRating / sessionsCount).toFixed(1)),
    };
  }

  private buildOverview(average: any) {
    return {
      trainingSessions: 0,
      matches: 0,
      avgCoachRating: average.coachRating || 0,
      trend: 'stable',
    };
  }

  private buildChartData(sessions: any[]) {
    return [...sessions]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((session) => {
        const serve = session.serving || {};
        const ground = session.groundstrokes || {};
        const net = session.netPlay || {};
        const rally = session.rally || {};
        const firstServeRate = serve.firstServeTotal ? ((serve.firstServeIn || 0) / serve.firstServeTotal) * 100 : 0;
        const secondServeRate = serve.secondServeTotal ? ((serve.secondServeIn || 0) / serve.secondServeTotal) * 100 : 0;
        const deepRate = ground.total ? ((ground.deep || 0) / ground.total) * 100 : 0;
        const netWinRate = net.approaches ? ((net.won || 0) / net.approaches) * 100 : 0;
        return {
          date: new Date(session.date).toISOString().slice(0, 10),
          title: session.title,
          firstServeRate: Number(firstServeRate.toFixed(1)),
          secondServeRate: Number(secondServeRate.toFixed(1)),
          deepRate: Number(deepRate.toFixed(1)),
          netWinRate: Number(netWinRate.toFixed(1)),
          coachRating: Number((session.coachRating || 0).toFixed(1)),
        };
      });
  }
}
