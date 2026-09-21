import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { SportsAnalysisController } from './sportsAnalysis.controller';
import { PlayerSportsAnalysisController } from './player-sports-analysis.controller';
import { SportsAnalysisRepository } from './sportsAnalysis.repository';
import { SportsAnalysisService } from './sportsAnalysis.service';
import { SportsAnalysisSession, SportsAnalysisSessionSchema } from './sportsAnalysis.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SportsAnalysisSession.name, schema: SportsAnalysisSessionSchema },
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [SportsAnalysisController, PlayerSportsAnalysisController],
  providers: [SportsAnalysisService, SportsAnalysisRepository],
  exports: [SportsAnalysisService],
})
export class SportsAnalysisModule {}
