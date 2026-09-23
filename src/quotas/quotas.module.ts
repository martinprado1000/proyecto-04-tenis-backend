import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { QuotasController } from './quotas.controller';
import { QuotasRepository } from './quotas.repository';
import { QuotasService } from './quotas.service';
import { Quota, QuotaSchema } from './schemas/quota.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Quota.name, schema: QuotaSchema }]), AuthModule, UsersModule],
  controllers: [QuotasController],
  providers: [QuotasRepository, QuotasService],
  exports: [QuotasService],
})
export class QuotasModule {}
