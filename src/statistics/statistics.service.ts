import { Inject, Injectable } from '@nestjs/common';
import { TournamentsService } from 'src/tournaments/tournaments.service';
import { UsersService } from 'src/users/users.service';
import { StatisticsQueryDto } from './dto/statistics-query.dto';
import { STATISTICS_REPOSITORY, StatisticsRepositoryInterface } from './interfaces/statistics.repository.interface';

const emptySummary = () => ({
  matchesPlayed: 0, matchesWon: 0, matchesLost: 0, setsWon: 0, setsLost: 0,
  gamesWon: 0, gamesLost: 0, tieBreaksWon: 0, tieBreaksLost: 0,
  tournamentsPlayed: 0, tournamentsWon: 0, finalsPlayed: 0, winRate: 0,
});

@Injectable()
export class StatisticsService {
  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly usersService: UsersService,
    @Inject(STATISTICS_REPOSITORY) private readonly repository: StatisticsRepositoryInterface,
  ) {}

  async getMine(userId: string, organizationId: string, query: StatisticsQueryDto = {}) {
    if (!organizationId) return { summary: emptySummary(), byTournament: [], byMonth: [], availableYears: [] };

    const tournaments = await this.tournamentsService.findAll(organizationId, true);
    const normalizedUserId = String(userId);

    const byTournamentMap = new Map<string, any>();
    const chartMonthMap = new Map<string, any>();
    const availableYearsSet = new Set<number>();

    const reqYear = query.year ? Number(query.year) : undefined;
    const reqMonth = query.month ? Number(query.month) : undefined;
    const reqTipo = query.tipo;
    const reqTournamentId = query.tournamentId;

    for (const tournament of tournaments) {
      const singles = String(tournament.formato || '').toLowerCase().includes('single');
      const tipo = singles ? 'singles' : 'dobles';

      if (reqTipo && tipo !== reqTipo) continue;

      const tournamentIdStr = String(tournament.id ?? tournament._id ?? '');
      if (reqTournamentId && tournamentIdStr !== reqTournamentId) continue;

      const participants = singles ? tournament.jugadores || [] : tournament.equipos || [];
      const own = participants.find((p: any) => this.belongsTo(p, normalizedUserId));
      if (!own) continue;

      for (const match of tournament.fechas || []) {
        const side = this.belongsToMatch(match, normalizedUserId, singles);
        if (side !== 0 && side !== 1) continue;
        if (!match.jugado || !Array.isArray(match.sets) || !match.sets.length) continue;

        const other = [match.participante1, match.participante2];
        if (other.length < 2 || !other[0] || !other[1]) continue;

        const matchDate = match.fecha
          ? new Date(match.fecha)
          : (tournament.fechaInicio ? new Date(tournament.fechaInicio) : null);

        const dateValid = matchDate && !Number.isNaN(matchDate.getTime());
        const mYear = dateValid ? matchDate.getUTCFullYear() : undefined;
        const mMonth = dateValid ? matchDate.getUTCMonth() + 1 : undefined;

        if (mYear) {
          availableYearsSet.add(mYear);
        }

        const matchMatchesYear = !reqYear || mYear === reqYear;
        const matchMatchesMonth = !reqMonth || mMonth === reqMonth;

        const ownIsLocal = side === 0;
        let ownSets = 0, rivalSets = 0, ownGames = 0, rivalGames = 0, ownTie = 0, rivalTie = 0;
        for (const set of match.sets) {
          const local = Number(set.local), visitante = Number(set.visitante);
          if (!Number.isFinite(local) || !Number.isFinite(visitante)) continue;
          ownGames += ownIsLocal ? local : visitante;
          rivalGames += ownIsLocal ? visitante : local;
          if (local > visitante) ownSets += ownIsLocal ? 1 : 0, rivalSets += ownIsLocal ? 0 : 1;
          else rivalSets += ownIsLocal ? 1 : 0, ownSets += ownIsLocal ? 0 : 1;
          const tie = Number.isFinite(Number(set.tieBreakLocal)) && Number.isFinite(Number(set.tieBreakVisitante));
          if (tie) (ownIsLocal ? Number(set.tieBreakLocal) > Number(set.tieBreakVisitante) : Number(set.tieBreakVisitante) > Number(set.tieBreakLocal)) ? ownTie++ : rivalTie++;
        }
        if (!ownSets && !rivalSets) continue;
        const won = ownSets > rivalSets;

        if (matchMatchesYear && mYear && mMonth) {
          const monthKey = `${mYear}-${mMonth}`;
          let monthObj = chartMonthMap.get(monthKey);
          if (!monthObj) {
            monthObj = {
              year: mYear,
              month: mMonth,
              matchesPlayed: 0,
              matchesWon: 0,
              matchesLost: 0,
              setsWon: 0,
              setsLost: 0,
              gamesWon: 0,
              gamesLost: 0,
            };
            chartMonthMap.set(monthKey, monthObj);
          }
          monthObj.matchesPlayed++;
          won ? monthObj.matchesWon++ : monthObj.matchesLost++;
          monthObj.setsWon += ownSets;
          monthObj.setsLost += rivalSets;
          monthObj.gamesWon += ownGames;
          monthObj.gamesLost += rivalGames;
        }

        if (matchMatchesYear && matchMatchesMonth) {
          let tStats = byTournamentMap.get(tournamentIdStr);
          if (!tStats) {
            tStats = {
              tournamentId: tournament.id ?? tournament._id,
              tournamentName: tournament.name,
              formato: tournament.formato,
              tipo,
              matchesPlayed: 0,
              matchesWon: 0,
              matchesLost: 0,
              setsWon: 0,
              setsLost: 0,
              gamesWon: 0,
              gamesLost: 0,
              points: 0,
              lastPlayedDate: null,
            };
            byTournamentMap.set(tournamentIdStr, tStats);
          }
          tStats.matchesPlayed++;
          won ? tStats.matchesWon++ : tStats.matchesLost++;
          tStats.setsWon += ownSets;
          tStats.setsLost += rivalSets;
          tStats.gamesWon += ownGames;
          tStats.gamesLost += rivalGames;
          if (won) tStats.points++;
          if (dateValid) tStats.lastPlayedDate = matchDate;
        }
      }
    }

    const byTournament = Array.from(byTournamentMap.values());
    const summary = this.sumTournamentStats(byTournament);
    const byMonth = Array.from(chartMonthMap.values()).sort((a, b) => a.year - b.year || a.month - b.month);
    const availableYears = Array.from(availableYearsSet).sort((a, b) => b - a);

    if (!reqYear && !reqMonth && !reqTipo && !reqTournamentId) {
      await this.repository.upsert(userId, organizationId, { summary, byTournament, byMonth } as any);
    }

    return { summary, byTournament, byMonth, availableYears };
  }

  async recalculate(userId: string, organizationId: string) {
    return this.getMine(userId, organizationId, {});
  }

  private sumTournamentStats(items: any[]) {
    const summary = emptySummary();
    summary.tournamentsPlayed = items.length;
    for (const item of items) for (const key of ['matchesPlayed','matchesWon','matchesLost','setsWon','setsLost','gamesWon','gamesLost','points']) summary[key] += item[key] || 0;
    summary.winRate = summary.matchesPlayed ? Math.round((summary.matchesWon / summary.matchesPlayed) * 1000) / 10 : 0;
    summary.tournamentsWon = items.filter((item) => item.result === 'Ganador' || item.position === 1).length;
    summary.finalsPlayed = items.filter((item) => item.position === 1 || item.position === 2).length;
    return summary;
  }

  private belongsTo(participant: any, userId: string) {
    return String(participant?.id ?? participant?._id ?? '') === String(userId) || [participant?.integrante1, participant?.integrante2].some((member) => String(member?.id ?? member?._id ?? '') === String(userId));
  }

  private belongsToMatch(match: any, userId: string, singles: boolean) {
    const list = [match.participante1, match.participante2];
    if (!Array.isArray(list)) return -1;
    if (this.belongsTo(list[0], userId)) return 0;
    if (this.belongsTo(list[1], userId)) return 1;
    return -1;
  }

  async getPlayers(organizationId: string) {
    // Return minimal player info for the rival selector
    const paginationDto = { limit: 500, offset: 0 };
    const users = await this.usersService.findAllActiveUsersResponse(paginationDto, organizationId) as any;
    const list = Array.isArray(users) ? users : (users?.data ?? []);
    return list.map((u: any) => ({
      id: u.id || u._id,
      name: u.name || u.nombre || '',
      lastname: u.lastname || u.apellido || '',
    }));
  }

  async getH2H(userId: string, rivalId: string, organizationId: string) {
    const tournaments = await this.tournamentsService.findAll(organizationId, true);

    const empty = () => ({ matchesWon: 0, matchesLost: 0, setsWon: 0, setsLost: 0, points: 0 });
    const playerStats = empty();
    const rivalStats = empty();

    let playerName = '';
    let rivalName = '';

    const getName = (participant: any) => {
      if (!participant) return '';
      // Could be a user object or a team
      if (participant.name || participant.lastname) return `${participant.name || ''} ${participant.lastname || ''}`.trim();
      if (participant.nombre || participant.apellido) return `${participant.nombre || ''} ${participant.apellido || ''}`.trim();
      // Team
      if (participant.integrante1) {
        const i1 = `${participant.integrante1.name || ''} ${participant.integrante1.lastname || ''}`.trim();
        const i2 = `${participant.integrante2?.name || ''} ${participant.integrante2?.lastname || ''}`.trim();
        return `${i1} / ${i2}`;
      }
      return '';
    };

    for (const tournament of tournaments) {
      const singles = String(tournament.formato || '').toLowerCase().includes('single');

      for (const match of tournament.fechas || []) {
        if (!match.jugado || !Array.isArray(match.sets) || !match.sets.length) continue;
        if (!match.participante1 || !match.participante2) continue;

        const p1IsUser = this.belongsTo(match.participante1, userId);
        const p1IsRival = this.belongsTo(match.participante1, rivalId);
        const p2IsUser = this.belongsTo(match.participante2, userId);
        const p2IsRival = this.belongsTo(match.participante2, rivalId);

        // Only care about matches where both player and rival participate
        if (!((p1IsUser && p2IsRival) || (p1IsRival && p2IsUser))) continue;

        const userIsLocal = p1IsUser;

        if (!playerName) playerName = getName(userIsLocal ? match.participante1 : match.participante2);
        if (!rivalName) rivalName = getName(userIsLocal ? match.participante2 : match.participante1);

        let userSets = 0, rivalSets = 0, userGames = 0, rivalGames = 0;
        for (const set of match.sets) {
          const local = Number(set.local), visitante = Number(set.visitante);
          if (!Number.isFinite(local) || !Number.isFinite(visitante)) continue;
          if (userIsLocal) {
            userGames += local; rivalGames += visitante;
            local > visitante ? userSets++ : rivalSets++;
          } else {
            userGames += visitante; rivalGames += local;
            visitante > local ? userSets++ : rivalSets++;
          }
        }

        if (!userSets && !rivalSets) continue;

        playerStats.setsWon += userSets;
        playerStats.setsLost += rivalSets;
        rivalStats.setsWon += rivalSets;
        rivalStats.setsLost += userSets;

        if (userSets > rivalSets) {
          playerStats.matchesWon++;
          playerStats.points++;
          rivalStats.matchesLost++;
        } else {
          rivalStats.matchesWon++;
          rivalStats.points++;
          playerStats.matchesLost++;
        }
      }
    }

    return {
      player: { id: userId, name: playerName, ...playerStats },
      rival: { id: rivalId, name: rivalName, ...rivalStats },
    };
  }
}
