import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TournamentsController } from './tournaments.controller';
import { PlayerTournamentsController } from './player-tournaments.controller';
import { PublicTournamentsController } from './public-tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { Tournament, TournamentSchema } from './schemas/tournament.schema';
import { TournamentsRepository } from './tournaments.repository';
import { TOURNAMENTS_REPOSITORY_INTERFACE } from './interfaces/tournaments-repository.interface';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { TeamsModule } from 'src/teams/teams.module';
import { OrganizationsModule } from 'src/organizations/organizations.module';
import { CustomLoggerService } from 'src/logger/logger.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tournament.name, schema: TournamentSchema }]),
    AuthModule,
    UsersModule,
    TeamsModule,
    OrganizationsModule,
  ],
  controllers: [TournamentsController, PlayerTournamentsController, PublicTournamentsController],
  providers: [
    TournamentsService,
    CustomLoggerService,
    TournamentsRepository,
    {
      provide: TOURNAMENTS_REPOSITORY_INTERFACE,
      useClass: TournamentsRepository,
    },
  ],
  exports: [TournamentsService],
})
export class TournamentsModule {}
