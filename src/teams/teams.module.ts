import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { Team, TeamSchema } from './schemas/team.schema';
import { TeamsRepository } from './teams.repository';
import { TEAMS_REPOSITORY_INTERFACE } from './interfaces/teams-repository.interface';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { CustomLoggerService } from 'src/logger/logger.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Team.name, schema: TeamSchema }]),
    UsersModule,
    AuthModule,
  ],
  controllers: [TeamsController],
  providers: [
    TeamsService,
    CustomLoggerService,
    TeamsRepository,
    {
      provide: TEAMS_REPOSITORY_INTERFACE,
      useClass: TeamsRepository,
    },
  ],
  exports: [TeamsService],
})
export class TeamsModule {}
