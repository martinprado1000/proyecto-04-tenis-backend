import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTournamentDto, UpdateTournamentDto } from './dto';
import {
  TOURNAMENTS_REPOSITORY_INTERFACE,
  TournamentsRepositoryInterface,
} from './interfaces/tournaments-repository.interface';
import { UsersService } from 'src/users/users.service';
import { TeamsService } from 'src/teams/teams.service';
import { CustomLoggerService } from 'src/logger/logger.service';

@Injectable()
export class TournamentsService {
  constructor(
    @Inject(TOURNAMENTS_REPOSITORY_INTERFACE)
    private readonly tournamentsRepository: TournamentsRepositoryInterface,
    private readonly usersService: UsersService,
    private readonly teamsService: TeamsService,
    private readonly logger: CustomLoggerService,
  ) {}

  async findAll(organizationId?: string, withDeleted = false): Promise<any[]> {
    const tournaments = await this.tournamentsRepository.findAll(organizationId, withDeleted);
    return tournaments.map((t) => this.mapTournamentToResponse(t));
  }

  async findOne(id: string, organizationId?: string): Promise<any> {
    const tournament = await this.tournamentsRepository.findById(id, organizationId);
    if (!tournament) {
      throw new NotFoundException(`Torneo con id ${id} no encontrado`);
    }
    return this.mapTournamentToResponse(tournament);
  }

  async getPlayerMatches(userId: string, organizationId?: string): Promise<any> {
    const tournaments = await this.findAll(organizationId, true);
    const belongsToParticipant = (participant: any) => {
      if (!participant) return false;
      if (String(participant.id ?? participant._id ?? participant ?? '') === String(userId)) return true;
      return [participant.integrante1, participant.integrante2].some(
        (member) => String(member?.id ?? member?._id ?? member ?? '') === String(userId),
      );
    };
    const participantName = (participant: any) => {
      if (!participant) return 'Por definir';
      if (participant.nombre || participant.apellido) {
        return `${participant.nombre || ''} ${participant.apellido || ''}`.trim();
      }
      return participant.name || 'Por definir';
    };
    const participantPhones = (participant: any) => {
      if (!participant) return [];
      const members = [participant, participant.integrante1, participant.integrante2];
      return [...new Set(members.map((member) => member?.telefono?.trim()).filter(Boolean))];
    };
    const getWinner = (match: any) => {
      if (!match.jugado || !Array.isArray(match.sets)) return null;
      let p1Wins = 0;
      let p2Wins = 0;
      for (const set of match.sets) {
        const local = Number(set?.local);
        const visitante = Number(set?.visitante);
        if (!Number.isFinite(local) || !Number.isFinite(visitante)) continue;
        if (local > visitante) p1Wins++;
        if (visitante > local) p2Wins++;
      }
      if (p1Wins === p2Wins) return null;
      return p1Wins > p2Wins ? match.participante1 : match.participante2;
    };

    const playerTournaments = tournaments.flatMap((tournament) => {
      const isSingles = tournament.formato?.toLowerCase().includes('single');
      const ownParticipant = isSingles
        ? (tournament.jugadores || []).find((player) => String(player?.id ?? player?._id ?? player ?? '') === String(userId))
        : (tournament.equipos || []).find((team) => belongsToParticipant(team));
      const hasPlayerMatch = (tournament.fechas || []).some((match) => {
        return belongsToParticipant(match.participante1) || belongsToParticipant(match.participante2);
      });

      if (!ownParticipant && !hasPlayerMatch) return [];

      const matches = tournament.fechas
        .map((match) => {
          const participant1 = match.participante1 || (Array.isArray(match.jugadores) ? match.jugadores[0] : match.equipos?.[0]);
          const participant2 = match.participante2 || (Array.isArray(match.jugadores) ? match.jugadores[1] : match.equipos?.[1]);
          const normalizedParticipant1 = typeof participant1 === 'string' ? { id: participant1 } : participant1;
          const normalizedParticipant2 = typeof participant2 === 'string' ? { id: participant2 } : participant2;
          const isParticipant1 = belongsToParticipant(normalizedParticipant1);
          const isParticipant2 = belongsToParticipant(normalizedParticipant2);
          if (!isParticipant1 && !isParticipant2) return null;
          const rival = isParticipant1 ? normalizedParticipant2 : normalizedParticipant1;
          const winner = getWinner(match);
          return {
            id: match.id,
            rival: participantName(rival),
            rivalTelefonos: participantPhones(rival),
            fecha: match.fecha,
            resultado: match.resultado || '-',
            estado: match.jugado ? 'Jugado' : 'Pendiente',
            jugado: match.jugado,
            ganado: Boolean(winner && belongsToParticipant(winner)),
            round: match.round,
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          if (!a.fecha) return 1;
          if (!b.fecha) return -1;
          return a.fecha.localeCompare(b.fecha);
        });

      const playedMatches = matches.filter((match) => match.jugado);
      const wonMatches = playedMatches.filter((match) => match.ganado);
      return [{
        id: tournament._id ? tournament._id.toString() : tournament.id,
        name: tournament.name,
        formato: tournament.formato,
        tipo: isSingles ? 'singles' : 'dobles',
        stats: {
          partidosJugados: playedMatches.length,
          partidosGanados: wonMatches.length,
          puntos: wonMatches.length,
        },
        matches,
        torneoCompleto: this.buildTournamentWithMatchParticipants(tournament),
      }];
    });

    return {
      singles: playerTournaments.filter((tournament) => tournament.tipo === 'singles'),
      dobles: playerTournaments.filter((tournament) => tournament.tipo === 'dobles'),
      torneos: playerTournaments,
    };
  }

  async create(createTournamentDto: CreateTournamentDto): Promise<any> {
    if (createTournamentDto.jugadores && createTournamentDto.jugadores.length > 0) {
      await this.validateJugadores(createTournamentDto.formato, createTournamentDto.jugadores);
    }

    if (createTournamentDto.equipos && createTournamentDto.equipos.length > 0) {
      await this.validateEquipos(createTournamentDto.formato, createTournamentDto.equipos);
    }

    const newTournament = await this.tournamentsRepository.create(createTournamentDto);
    this.logger.log(
      TournamentsService.name,
      `Torneo ${newTournament.name} creado con id ${newTournament._id}`,
    );
    return this.mapTournamentToResponse(newTournament);
  }

  async update(id: string, updateTournamentDto: UpdateTournamentDto, organizationId?: string): Promise<any> {
    const tournament = await this.tournamentsRepository.findById(id, organizationId);
    if (!tournament) {
      throw new NotFoundException(`Torneo con id ${id} no encontrado`);
    }

    const targetFormat = updateTournamentDto.formato || tournament.formato;

    if (updateTournamentDto.jugadores) {
      await this.validateJugadores(targetFormat, updateTournamentDto.jugadores);
    }

    if (updateTournamentDto.equipos) {
      await this.validateEquipos(targetFormat, updateTournamentDto.equipos);
    }

    const updatedTournament = await this.tournamentsRepository.update(id, updateTournamentDto);
    this.logger.log(TournamentsService.name, `Torneo con id ${id} actualizado`);
    return this.mapTournamentToResponse(updatedTournament);
  }

  async assignJugadores(id: string, jugadoresIds: string[], organizationId?: string, modo?: string, reemplazarId?: string, nuevoId?: string): Promise<any> {
    const tournament = await this.tournamentsRepository.findById(id, organizationId);
    if (!tournament) {
      throw new NotFoundException(`Torneo con id ${id} no encontrado`);
    }

    await this.validateJugadores(tournament.formato, jugadoresIds);

    const normalizeId = (value: any) => value?._id?.toString() || value?.id?.toString() || value?.toString();
    const normalizedJugadoresIds = jugadoresIds.map((value) => normalizeId(value));
    const previousIds = (tournament.jugadores || []).map(normalizeId);
    const removedIds = previousIds.filter((playerId) => !normalizedJugadoresIds.includes(playerId))
    const update: any = {
      jugadores: normalizedJugadoresIds,
      equipos: [],
      jugadoresExcluidos: modo === 'reemplazo'
        ? (tournament.jugadoresExcluidos || []).map((p: any) => p._id?.toString() || p.toString())
        : [...new Set([...(tournament.jugadoresExcluidos || []).map((p: any) => p._id?.toString() || p.toString()), ...removedIds])],
    };
    if (modo === 'reemplazo') {
      const oldId = reemplazarId || removedIds[0];
      const newId = nuevoId || normalizedJugadoresIds.find((playerId) => !previousIds.includes(playerId));
      if (oldId && newId) {
        update.fechas = (tournament.fechas || []).map((fecha: any) => {
          const jugadores = Array.isArray(fecha.jugadores) ? [...fecha.jugadores] : [];
          const position = jugadores.findIndex((player: any) => normalizeId(player) === oldId);
          if (position < 0) return fecha;
          jugadores[position] = newId;
          return { ...fecha, jugadores, [`reemplazado${position + 1}`]: true };
        });
      }
    }
    const updatedTournament = await this.tournamentsRepository.update(id, update);

    this.logger.log(TournamentsService.name, `Jugadores asignados al torneo ${id}`);
    return this.mapTournamentToResponse(updatedTournament);
  }

  async assignEquipos(id: string, equiposIds: string[], organizationId?: string, modo?: string, reemplazarId?: string, nuevoId?: string): Promise<any> {
    const tournament = await this.tournamentsRepository.findById(id, organizationId);
    if (!tournament) {
      throw new NotFoundException(`Torneo con id ${id} no encontrado`);
    }

    await this.validateEquipos(tournament.formato, equiposIds);

    const normalizeId = (value: any) => value?._id?.toString() || value?.id?.toString() || value?.toString();
    const normalizedEquiposIds = equiposIds.map((value) => normalizeId(value));
    const previousIds = (tournament.equipos || []).map(normalizeId);
    const removedIds = previousIds.filter((teamId) => !normalizedEquiposIds.includes(teamId))
    const update: any = {
      equipos: normalizedEquiposIds,
      jugadores: [],
      equiposExcluidos: modo === 'reemplazo'
        ? (tournament.equiposExcluidos || []).map((t: any) => t._id?.toString() || t.toString())
        : [...new Set([...(tournament.equiposExcluidos || []).map((t: any) => t._id?.toString() || t.toString()), ...removedIds])],
    };
    if (modo === 'reemplazo') {
      const oldId = reemplazarId || removedIds[0];
      const newId = nuevoId || normalizedEquiposIds.find((teamId) => !previousIds.includes(teamId));
      if (oldId && newId) {
        update.fechas = (tournament.fechas || []).map((fecha: any) => {
          const equipos = Array.isArray(fecha.equipos) ? [...fecha.equipos] : [];
          const position = equipos.findIndex((team: any) => normalizeId(team) === oldId);
          if (position < 0) return fecha;
          equipos[position] = newId;
          return { ...fecha, equipos, [`reemplazado${position + 1}`]: true };
        });
      }
    }
    const updatedTournament = await this.tournamentsRepository.update(id, update);

    this.logger.log(TournamentsService.name, `Equipos asignados al torneo ${id}`);
    return this.mapTournamentToResponse(updatedTournament);
  }

  async delete(id: string, organizationId?: string): Promise<void> {
    const tournament = await this.tournamentsRepository.findById(id, organizationId);
    if (!tournament) {
      throw new NotFoundException(`Torneo con id ${id} no encontrado`);
    }
    await this.tournamentsRepository.delete(id);
    this.logger.log(TournamentsService.name, `Torneo con id ${id} eliminado`);
  }

  async generarFechas(id: string, organizationId?: string): Promise<any> {
    const tournament = await this.tournamentsRepository.findById(id, organizationId);
    if (!tournament) throw new NotFoundException(`Torneo con id ${id} no encontrado`);

    if (tournament.fechas && tournament.fechas.length > 0) {
      throw new BadRequestException('Las fechas ya fueron generadas para este torneo');
    }

    const formato = (tournament.formato || '').toString();
    const esSingle = formato.includes('Single');
    const participantes = esSingle ? (tournament.jugadores || []).map((p:any)=> p._id ? p._id.toString() : p) : (tournament.equipos || []).map((p:any)=> p._id ? p._id.toString() : p);
    const maxSets = Number(tournament.setsCount || 3);

    const emptySets = () => Array.from({ length: maxSets }).map(() => ({ local: null, visitante: null }));

    if (!participantes || participantes.length < 2) {
      throw new BadRequestException('No hay suficientes participantes para generar fechas');
    }

    // shuffle
    const shuffled = participantes.slice().sort(() => Math.random() - 0.5);

    let fechas: any[] = [];

    if (formato.toLowerCase().includes('roundrobin') || formato.toLowerCase().includes('round robin')) {
      // Round-robin scheduling using circle algorithm (Berger tables)
      const pool: (string | null)[] = shuffled.slice();
      if (pool.length % 2 !== 0) {
        pool.push(null); // Add dummy bye for odd number of participants
      }

      const numParticipants = pool.length;
      const numRounds = numParticipants - 1;
      const matchesPerRound = numParticipants / 2;
      let order = 0;

      for (let r = 0; r < numRounds; r++) {
        for (let i = 0; i < matchesPerRound; i++) {
          const p1 = pool[i];
          const p2 = pool[numParticipants - 1 - i];

          if (p1 && p2) {
            fechas.push({
              jugadores: esSingle ? [p1, p2] : undefined,
              equipos: esSingle ? undefined : [p1, p2],
              fecha: null,
              sets: emptySets(),
              resultado: null,
              jugado: false,
              round: r + 1,
              order: order++,
            });
          }
        }
        // Rotate pool keeping pool[0] fixed
        const last = pool.pop()!;
        pool.splice(1, 0, last);
      }
    } else {
      // Playoffs: Power-of-2 bracket tree with BYEs
      let order = 0;
      const N = shuffled.length;
      let P = 2;
      while (P < N) {
        P *= 2;
      }
      const totalRounds = Math.round(Math.log2(P));

      // Round 1 matches count = N - P/2
      const numR1Matches = N - (P / 2);
      const numPlayingInR1 = numR1Matches * 2;

      const r1Playing = shuffled.slice(0, numPlayingInR1);
      const r1Byes = shuffled.slice(numPlayingInR1);

      // Create Round 1 matches if any players need to play in Round 1
      if (numR1Matches > 0) {
        for (let i = 0; i < numR1Matches; i++) {
          const a = r1Playing[i * 2];
          const b = r1Playing[i * 2 + 1];
          fechas.push({
            jugadores: esSingle ? [a, b] : undefined,
            equipos: esSingle ? undefined : [a, b],
            fecha: null,
            sets: emptySets(),
            resultado: null,
            jugado: false,
            round: 1,
            order: order++,
          });
        }
      }

      // BYE players fill remaining slots in Round 2
      const currentRoundSlots: (string | null)[] = [];
      if (numR1Matches > 0) {
        for (let i = 0; i < numR1Matches; i++) {
          currentRoundSlots.push(null);
        }
      }
      for (const byePlayer of r1Byes) {
        currentRoundSlots.push(byePlayer);
      }
      while (currentRoundSlots.length < P / 2) {
        currentRoundSlots.push(null);
      }

      // Build rounds 2 through totalRounds
      let prevSlots = currentRoundSlots;
      for (let r = 2; r <= totalRounds; r++) {
        const matchesInRoundCount = P / Math.pow(2, r);
        const nextSlots: (string | null)[] = [];

        for (let k = 0; k < matchesInRoundCount; k++) {
          const p1 = (r === 2) ? prevSlots[k * 2] : null;
          const p2 = (r === 2) ? prevSlots[k * 2 + 1] : null;

          fechas.push({
            jugadores: esSingle ? [p1, p2] : undefined,
            equipos: esSingle ? undefined : [p1, p2],
            fecha: null,
            sets: emptySets(),
            resultado: null,
            jugado: false,
            round: r,
            order: order++,
          });

          nextSlots.push(null);
        }
        prevSlots = nextSlots;
      }

      // Add third-place match if N >= 4
      if (N >= 4) {
        fechas.push({
          jugadores: esSingle ? [null, null] : undefined,
          equipos: esSingle ? undefined : [null, null],
          fecha: null,
          sets: emptySets(),
          resultado: null,
          jugado: false,
          round: totalRounds,
          order: order++,
          thirdPlace: true,
        });
      }
    }

    const updated = await this.tournamentsRepository.update(id, { fechas });
    // log summary for debugging: number of fechas and presence of thirdPlace placeholder
    const hasThird = fechas.some((f) => f.thirdPlace === true);
    this.logger.log(TournamentsService.name, `Fechas generadas para torneo ${id} - total: ${fechas.length} - thirdPlace:${hasThird}`);
    return this.mapTournamentToResponse(updated);
  }

  async updateFecha(id: string, idx: number, body: any, organizationId?: string): Promise<any> {
    const tournament = await this.tournamentsRepository.findById(id, organizationId);
    if (!tournament) throw new NotFoundException(`Torneo con id ${id} no encontrado`);
    if (!Array.isArray(tournament.fechas) || !tournament.fechas[idx]) throw new NotFoundException('Fecha no encontrada');

    const targetMatch = tournament.fechas[idx];
    const isSingleFmt = (tournament.formato || '').includes('Single');
    const p1 = isSingleFmt
      ? (targetMatch.jugadores && targetMatch.jugadores[0])
      : (targetMatch.equipos && targetMatch.equipos[0]);
    const p2 = isSingleFmt
      ? (targetMatch.jugadores && targetMatch.jugadores[1])
      : (targetMatch.equipos && targetMatch.equipos[1]);

    if (!p1 || !p2) {
      throw new BadRequestException(
        'No se pueden ingresar resultados hasta que ambos participantes estén asignados al partido.',
      );
    }

    if (body.fecha !== undefined) {
      if (body.fecha !== null && body.fecha !== '' && Number.isNaN(new Date(body.fecha).getTime())) {
        throw new BadRequestException('La fecha límite no es válida');
      }
      tournament.fechas[idx].fecha = body.fecha || null;
      const updatedByDate = await this.tournamentsRepository.update(id, { fechas: tournament.fechas });
      return this.mapTournamentToResponse(updatedByDate);
    }

    const sets = body.sets;
    const maxSets = Number(tournament.setsCount || 3);
    const minSetsRequired = Math.ceil(maxSets / 2);

    if (!Array.isArray(sets) || sets.length < minSetsRequired) {
      throw new BadRequestException(`Se requieren al menos ${minSetsRequired} sets`);
    }

    if (sets.length > maxSets) {
      throw new BadRequestException(`No se pueden enviar más de ${maxSets} sets`);
    }

    // Helper to validate individual set
    const validateSetScore = (s: any, idxSet: number) => {
      if (!Number.isInteger(s.local) || !Number.isInteger(s.visitante)) {
        throw new BadRequestException(`Set ${idxSet + 1}: los juegos deben ser números enteros`);
      }
      const local = s.local;
      const visitante = s.visitante;
      if (local < 0 || visitante < 0 || local > 7 || visitante > 7 || local === visitante) {
        throw new BadRequestException(`Set ${idxSet + 1}: marcador de juegos inválido`);
      }

      const isNormalSet = (local >= 6 && local <= 7 && visitante <= 4) || (visitante >= 6 && visitante <= 7 && local <= 4);
      const isSevenFive = (local === 7 && visitante === 5) || (visitante === 7 && local === 5);
      const isTieBreakSet = (local === 7 && visitante === 6) || (visitante === 7 && local === 6);
      if (!isNormalSet && !isSevenFive && !isTieBreakSet) {
        throw new BadRequestException(`Set ${idxSet + 1}: solo se permiten marcadores 6-0 a 6-4, 7-5 o 7-6`);
      }

      if (isTieBreakSet) {
        const tieLocal = Number(s.tieBreakLocal);
        const tieVisitante = Number(s.tieBreakVisitante);
        const tieBreakValido = Number.isInteger(tieLocal)
          && Number.isInteger(tieVisitante)
          && tieLocal >= 0
          && tieVisitante >= 0
          && Math.max(tieLocal, tieVisitante) >= 7
          && Math.abs(tieLocal - tieVisitante) === 2
          && (local === 7 ? tieLocal > tieVisitante : tieVisitante > tieLocal);
        if (!tieBreakValido) {
          throw new BadRequestException(`Set ${idxSet + 1}: el tie-break debe terminar con al menos 7 puntos y exactamente 2 de diferencia, y ganarlo el participante que tiene 7 juegos`);
        }
      } else if (s.tieBreakLocal !== undefined || s.tieBreakVisitante !== undefined) {
        throw new BadRequestException(`Set ${idxSet + 1}: solo el marcador 7-6 puede tener tie-break`);
      }
    };

    // Evaluate sequentially and ensure match cannot continue after winner reached
    let localWins = 0;
    let visitWins = 0;
    const majority = Math.ceil(maxSets / 2);

    for (let i = 0; i < sets.length; i++) {
      const s = sets[i];
      validateSetScore(s, i);

      // If match was already decided in previous sets, disallow extra sets
      if (localWins >= majority || visitWins >= majority) {
        throw new BadRequestException(`El partido ya fue decidido en sets anteriores; no se puede completar el set ${i + 1}`);
      }

      if (s.local > s.visitante) localWins++;
      else visitWins++;
    }

    // After processing provided sets, check if someone already reached majority
    if (localWins < majority && visitWins < majority) {
      // if we have room for more sets (not provided), and haven't reached majority, require more
      if (sets.length < maxSets) {
        throw new BadRequestException(`Se requiere completar más sets hasta que un jugador alcance ${majority} sets ganados`);
      }
      // else at maximum sets but no majority (shouldn't happen because no tied sets), still error
      throw new BadRequestException('No se pudo determinar un ganador con los sets proporcionados');
    }

    const debugActions: string[] = [];

    // Save sets and mark played
    tournament.fechas[idx].sets = sets;
    tournament.fechas[idx].jugado = true;
    tournament.fechas[idx].resultado = `${sets.map((s: any) => `${s.local}-${s.visitante}`).join(' / ')}`;
    // propagate winner to next round placeholder (if any)
    try {
      const currentRound = tournament.fechas[idx].round || 1;
      const nextRound = currentRound + 1;
      // build rounds grouping with original indices
      const rounds: Record<number, { f: any; i: number }[]> = {};
      tournament.fechas.forEach((f: any, i: number) => {
        const r = f.round || 1;
        if (!rounds[r]) rounds[r] = [];
        rounds[r].push({ f, i });
      });
      // sort by order inside each round
      Object.keys(rounds).forEach((k) => rounds[Number(k)].sort((a: any, b: any) => (a.f.order ?? 0) - (b.f.order ?? 0)));

      const currentRoundArr = rounds[currentRound] || [];
      const nextRoundArr = rounds[nextRound] || [];
      if (nextRoundArr.length > 0) {
        const posInCurrent = currentRoundArr.findIndex((x) => x.i === idx);
        if (posInCurrent >= 0) {
          const targetIndex = Math.floor(posInCurrent / 2);
          const target = nextRoundArr[targetIndex];
          if (target) {
            // determine winner id (can be jugador id or equipo id)
            const cur = tournament.fechas[idx];
            const pArr = cur.jugadores && cur.jugadores.length ? cur.jugadores : (cur.equipos && cur.equipos.length ? cur.equipos : null);
            const winnerId = (localWins > visitWins) ? (pArr ? pArr[0] : null) : (pArr ? pArr[1] : null);
            const loserId = (localWins > visitWins) ? (pArr ? pArr[1] : null) : (pArr ? pArr[0] : null);

            if (winnerId) {
              const targetF = target.f;
              const side = (posInCurrent % 2 === 0) ? 0 : 1;
              if (targetF.jugadores) {
                if (!Array.isArray(targetF.jugadores)) targetF.jugadores = [null, null];
                targetF.jugadores[side] = winnerId;
              } else if (targetF.equipos) {
                debugActions.push(`Propagado ganador ${winnerId} desde fecha idx ${idx} (round ${currentRound}, pos ${posInCurrent}) hacia fecha idx ${target.i} (round ${nextRound}) lado ${side}`);
                this.logger.log(TournamentsService.name, `Propagado ganador ${winnerId} -> fecha idx ${target.i} (round ${nextRound}) side ${side}`);
                if (!Array.isArray(targetF.equipos)) targetF.equipos = [null, null];
                targetF.equipos[side] = winnerId;
              }
              // write back to tournament.fechas at correct index
              tournament.fechas[target.i] = targetF;

              // Propagate loser to third place match if current round is semifinal
              const maxRound = Math.max(...Object.keys(rounds).map(Number));
              const semiRound = maxRound - 1;
              if (currentRound === semiRound && loserId) {
                const thirdIdx = tournament.fechas.findIndex((f: any) => f.thirdPlace === true);
                if (thirdIdx >= 0) {
                  const thirdF = tournament.fechas[thirdIdx];
                  if (thirdF.jugadores) {
                    if (!Array.isArray(thirdF.jugadores)) thirdF.jugadores = [null, null];
                    thirdF.jugadores[side] = loserId;
                  } else if (thirdF.equipos) {
                    if (!Array.isArray(thirdF.equipos)) thirdF.equipos = [null, null];
                    thirdF.equipos[side] = loserId;
                  }
                  tournament.fechas[thirdIdx] = thirdF;
                  debugActions.push(`Propagado perdedor ${loserId} hacia fecha idx ${thirdIdx} (Definición 3°) lado ${side}`);
                  this.logger.log(TournamentsService.name, `Propagado perdedor ${loserId} -> fecha idx ${thirdIdx} (3er puesto) side ${side}`);
                }
              }
            }
          }
        }
      }
    } catch (e) {
      const msg = `Error propagando ganador/perdedor: ${e?.message || e}`;
      debugActions.push(msg);
      this.logger.log(TournamentsService.name, msg);
    }

    // Fallback: If semifinal round just finished, populate third-place placeholder with semifinal losers
    try {
      const roundsAll: Record<number, { f: any; i: number }[]> = {};
      tournament.fechas.forEach((f: any, i: number) => {
        const r = f.round || 1;
        if (!roundsAll[r]) roundsAll[r] = [];
        roundsAll[r].push({ f, i });
      });
      Object.keys(roundsAll).forEach((k) => roundsAll[Number(k)].sort((a: any, b: any) => (a.f.order ?? 0) - (b.f.order ?? 0)));
      const maxRound = Math.max(...Object.keys(roundsAll).map(Number));
      const semiRound = maxRound - 1;
      const currentRound = tournament.fechas[idx].round || 1;

      if (currentRound === semiRound && roundsAll[semiRound] && roundsAll[semiRound].length > 0) {
        const semis = roundsAll[semiRound];
        const semisPlayed = semis.every((s) => s.f.jugado === true);
        if (semisPlayed) {
          // collect losers
          const losers = semis.map((s) => {
            const setsArr = s.f.sets || [];
            let lw = 0, vw = 0;
            for (const ss of setsArr) {
              const l = Number(ss.local);
              const v = Number(ss.visitante);
              if (!Number.isFinite(l) || !Number.isFinite(v)) continue;
              if (l > v) lw++; else if (v > l) vw++;
            }
            const pArr = s.f.jugadores && s.f.jugadores.length ? s.f.jugadores : (s.f.equipos && s.f.equipos.length ? s.f.equipos : null);
            if (!pArr || pArr.length < 2) return null;
            if (lw > vw) return pArr[1];
            if (vw > lw) return pArr[0];
            return null;
          }).filter(Boolean);

          if (losers.length >= 2) {
            const thirdIdx = tournament.fechas.findIndex((f: any) => f.thirdPlace === true);
            if (thirdIdx >= 0) {
              const thirdF = tournament.fechas[thirdIdx];
              if (thirdF.jugadores) {
                thirdF.jugadores = [losers[0], losers[1]];
              } else if (thirdF.equipos) {
                thirdF.equipos = [losers[0], losers[1]];
              }
              tournament.fechas[thirdIdx] = thirdF;
            }
          }
        }
      }
    } catch (e) {
      const msg = `Error asignando 3er puesto: ${e?.message || e}`;
      debugActions.push(msg);
      this.logger.log(TournamentsService.name, msg);
    }

    const updated = await this.tournamentsRepository.update(id, { fechas: tournament.fechas });
    this.logger.log(TournamentsService.name, `Resultado cargado para torneo ${id} fecha idx ${idx}`);
    const resp = this.mapTournamentToResponse(updated);
    return { ...resp, debugPropagation: debugActions };
  }

  private async validateJugadores(formato: string, jugadoresIds: string[]): Promise<void> {
    if (formato.includes('Dobles')) {
      throw new BadRequestException(
        'Los torneos de formato Dobles aceptan asignación de Equipos, no de jugadores individuales.',
      );
    }

    for (const userId of jugadoresIds) {
      const user = await this.usersService.findOne(userId);
      if (!user.isActive) {
        throw new BadRequestException(
          `El usuario ${user.name} ${user.lastname} está inactivo y no puede ser asignado al torneo.`,
        );
      }
      const userSexo = (user.sexo || '').toUpperCase();

      if (formato.includes('Masculino') && userSexo !== 'MASCULINO') {
        throw new BadRequestException(
          `El usuario ${user.name} ${user.lastname} no es de sexo Masculino. Los torneos Single Masculino solo aceptan jugadores masculinos.`,
        );
      }

      if (formato.includes('Femenino') && userSexo !== 'FEMENINO') {
        throw new BadRequestException(
          `El usuario ${user.name} ${user.lastname} no es de sexo Femenino. Los torneos Single Femenino solo aceptan jugadoras femeninas.`,
        );
      }
    }
  }

  private async validateEquipos(formato: string, equiposIds: string[]): Promise<void> {
    if (formato.includes('Single')) {
      throw new BadRequestException(
        'Los torneos de formato Single aceptan asignación de Jugadores individuales, no de equipos.',
      );
    }

    const playersInTournament = new Map<string, string>();

    for (const teamId of equiposIds) {
      const team = await this.teamsService.findOne(teamId);
      // Verificar que los integrantes del equipo estén activos
      const integ1 = team.integrante1 || {};
      const integ2 = team.integrante2 || {};
      if (integ1 && integ1.id && integ1.isActive === false) {
        throw new BadRequestException(
          `El integrante ${integ1.nombre || integ1.name} del equipo "${team.name}" está inactivo.`,
        );
      }
      if (integ2 && integ2.id && integ2.isActive === false) {
        throw new BadRequestException(
          `El integrante ${integ2.nombre || integ2.name} del equipo "${team.name}" está inactivo.`,
        );
      }
      const teamTipo = (team.tipo || '').toUpperCase();

      if (formato.includes('Masculino') && teamTipo !== 'MASCULINO') {
        throw new BadRequestException(
          `El equipo "${team.name}" no es de tipo Masculino. Los torneos Dobles Masculino solo aceptan equipos masculinos.`,
        );
      }

      if (formato.includes('Femenino') && teamTipo !== 'FEMENINO') {
        throw new BadRequestException(
          `El equipo "${team.name}" no es de tipo Femenino. Los torneos Dobles Femenino solo aceptan equipos femeninos.`,
        );
      }

      if (formato.includes('Mixto') && teamTipo !== 'MIXTO') {
        throw new BadRequestException(
          `El equipo "${team.name}" no es de tipo Mixto. Los torneos Dobles Mixto solo aceptan equipos mixtos.`,
        );
      }

      for (const member of [integ1, integ2]) {
        const memberId = member?.id?.toString();
        if (!memberId) continue;
        const previousTeam = playersInTournament.get(memberId);
        if (previousTeam) {
          const playerName = `${member.nombre || member.name || ''} ${member.apellido || member.lastname || ''}`.trim() || 'Un jugador';
          throw new BadRequestException(
            `${playerName} no puede integrar los equipos "${previousTeam}" y "${team.name}" dentro del mismo torneo de Dobles.`,
          );
        }
        playersInTournament.set(memberId, team.name);
      }
    }
  }

  private buildTournamentWithMatchParticipants(tournament: any) {
    const response = this.mapTournamentToResponse(tournament);
    const source = tournament.toObject ? tournament.toObject() : tournament;
    const users = source.jugadores || [];
    const teams = source.equipos || [];
    const mapParticipant = (value: any) => {
      if (!value) return null;
      const id = String(value?._id ?? value?.id ?? value);
      const user = users.find((item: any) => String(item?._id ?? item?.id) === id);
      if (user) return {
        id,
        nombre: user.name || user.nombre || '',
        apellido: user.lastname || user.apellido || '',
        email: user.email || '',
        telefono: user.telefono || '',
      };
      const team = teams.find((item: any) => String(item?._id ?? item?.id) === id);
      if (team) return this.mapTournamentTeam(team);
      return { id };
    };
    response.fechas = (source.fechas || []).map((match: any, index: number) => {
      const participants = Array.isArray(match.jugadores) && match.jugadores.length
        ? match.jugadores
        : (match.equipos || []);
      return {
        id: match._id ? match._id.toString() : `f-${index}`,
        participante1: mapParticipant(participants[0]),
        participante2: mapParticipant(participants[1]),
        fecha: match.fecha ? new Date(match.fecha).toISOString().split('T')[0] : null,
        sets: match.sets || [],
        resultado: match.resultado || null,
        jugado: Boolean(match.jugado),
        round: match.round || null,
        thirdPlace: Boolean(match.thirdPlace),
        reemplazado1: Boolean(match.reemplazado1),
        reemplazado2: Boolean(match.reemplazado2),
        order: match.order ?? null,
      };
    });
    return response;
  }

  private mapTournamentTeam(team: any) {
    const item = team?.toObject ? team.toObject() : team;
    return {
      id: item?._id ? item._id.toString() : item?.id,
      name: item?.name || '',
      integrante1: item?.integrante1,
      integrante2: item?.integrante2,
    };
  }

  private mapTournamentToResponse(tournament: any) {
    const obj = tournament.toObject ? tournament.toObject() : tournament;

    const mapUser = (u: any) => {
      if (!u) return null;
      if (typeof u === 'string') return { id: u, nombre: '', apellido: '', email: '' };
      const uObj = u.toObject ? u.toObject() : u;
      return {
        id: uObj._id ? uObj._id.toString() : uObj.id,
        nombre: uObj.name || uObj.nombre || '',
        apellido: uObj.lastname || uObj.apellido || '',
        email: uObj.email || '',
        telefono: uObj.telefono || '',
        dni: uObj.dni || '',
        sexo: uObj.sexo || '',

        categoria: uObj.categoria || uObj.categoriaSingle || '',
        categoriaSingle: uObj.categoriaSingle || uObj.categoria || '',
        organizationId: uObj.organizationId?._id?.toString() || uObj.organizationId?.toString() || obj.organizationId?._id?.toString() || obj.organizationId?.toString() || null,
        organizationName: uObj.organizationId?.name || null,
        isActive: uObj.isActive ?? true,
      };
    };

    const mapTeam = (t: any) => {
      if (!t) return null;
      if (typeof t === 'string') return { id: t, name: '' };
      const tObj = t.toObject ? t.toObject() : t;
      return {
        id: tObj._id ? tObj._id.toString() : tObj.id,
        name: tObj.name,
        tipo: tObj.tipo,
        integrante1: mapUser(tObj.integrante1),
        integrante2: mapUser(tObj.integrante2),
      };
    };

    return {
      id: obj._id ? obj._id.toString() : obj.id,
      name: obj.name,
      formato: obj.formato,
      fechaInicio: obj.fechaInicio ? new Date(obj.fechaInicio).toISOString().split('T')[0] : null,
      fechaFin: obj.fechaFin ? new Date(obj.fechaFin).toISOString().split('T')[0] : null,
      jugadores: Array.isArray(obj.jugadores) ? obj.jugadores.map(mapUser).filter(Boolean) : [],
      equipos: Array.isArray(obj.equipos) ? obj.equipos.map(mapTeam).filter(Boolean) : [],
      setsCount: obj.setsCount ?? 3,
      fechas: Array.isArray(obj.fechas)
        ? obj.fechas.map((f: any, idx: number) => {
            const mapParticipant = (id: any) => {
              if (!id) return null;
              const participantId = id._id ? id._id.toString() : id.toString();
              const asUser = (obj.jugadores || []).find((u: any) => (u._id ? u._id.toString() : u.id) === participantId)
              if (asUser) return mapUser(asUser);
              const asTeam = (obj.equipos || []).find((t: any) => (t._id ? t._id.toString() : t.id) === participantId)
              if (asTeam) return mapTeam(asTeam)
              const excludedUser = (obj.jugadoresExcluidos || []).find((u: any) => (u._id ? u._id.toString() : u.id) === participantId)
              if (excludedUser) return { ...mapUser(excludedUser), cancelado: true }
              const excludedTeam = (obj.equiposExcluidos || []).find((t: any) => (t._id ? t._id.toString() : t.id) === participantId)
              if (excludedTeam) return { ...mapTeam(excludedTeam), cancelado: true }
              return { id: participantId, cancelado: true };
            }

            const participants = Array.isArray(f.jugadores) && f.jugadores.length > 0
              ? f.jugadores
              : Array.isArray(f.equipos) && f.equipos.length > 0
                ? f.equipos
                : [];
            const p1 = mapParticipant(participants[0]);
            const p2 = mapParticipant(participants[1]);

            return {
              id: f._id ? f._id.toString() : `f-${idx}`,
              participante1: p1,
              participante2: p2,
              fecha: f.fecha ? new Date(f.fecha).toISOString().split('T')[0] : null,
              sets: f.sets || [],
              resultado: f.resultado || null,
              jugado: f.jugado || false,
              round: f.round || null,
              thirdPlace: f.thirdPlace || false,
              reemplazado1: f.reemplazado1 || false,
              reemplazado2: f.reemplazado2 || false,
              order: f.order || null,
            }
          }).sort((a:any,b:any)=> (a.order ?? 0) - (b.order ?? 0))
        : [],
      isActive: obj.isActive ?? true,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }
}
