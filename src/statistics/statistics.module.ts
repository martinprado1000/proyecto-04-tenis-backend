import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { TournamentsModule } from 'src/tournaments/tournaments.module';
import { UsersModule } from 'src/users/users.module';
import { PlayerStatistics, PlayerStatisticsSchema } from './schemas/player-statistics.schema';
import { StatisticsController } from './statistics.controller';
import { StatisticsRepository } from './statistics.repository';
import { StatisticsService } from './statistics.service';
import { STATISTICS_REPOSITORY } from './interfaces/statistics.repository.interface';

@Module({
  imports: [MongooseModule.forFeature([{ name: PlayerStatistics.name, schema: PlayerStatisticsSchema }]), AuthModule, TournamentsModule, UsersModule],
  controllers: [StatisticsController],
  providers: [StatisticsService, StatisticsRepository, { provide: STATISTICS_REPOSITORY, useClass: StatisticsRepository }],
  exports: [StatisticsService],
})
export class StatisticsModule {}
