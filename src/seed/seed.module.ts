import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SeedService } from 'src/seed/seed.service';
import { SeedController } from 'src/seed/seed.controller';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { OrganizationsModule } from 'src/organizations/organizations.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Tournament, TournamentSchema } from 'src/tournaments/schemas/tournament.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { PlayerStatistics, PlayerStatisticsSchema } from 'src/statistics/schemas/player-statistics.schema';
import { Organization, OrganizationSchema } from 'src/organizations/schemas/organization.schema';
import { SportsAnalysisSession, SportsAnalysisSessionSchema } from 'src/sportsAnalysis/sportsAnalysis.schema';

@Module({

  controllers: [SeedController],

  providers: [SeedService],

  imports: [
    ConfigModule,
    UsersModule,
    AuthModule,
    OrganizationsModule,
    MongooseModule.forFeature([
      { name: Tournament.name, schema: TournamentSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: User.name, schema: UserSchema },
      { name: PlayerStatistics.name, schema: PlayerStatisticsSchema },
      { name: SportsAnalysisSession.name, schema: SportsAnalysisSessionSchema },
    ]),
  ],

})
export class SeedModule { }
