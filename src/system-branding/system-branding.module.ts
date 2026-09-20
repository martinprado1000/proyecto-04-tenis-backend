import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { SystemBranding, SystemBrandingSchema } from './system-branding.schema'
import { SystemBrandingService } from './system-branding.service'
import { SystemBrandingController } from './system-branding.controller'

@Module({
  imports: [MongooseModule.forFeature([{ name: SystemBranding.name, schema: SystemBrandingSchema }])],
  providers: [SystemBrandingService],
  controllers: [SystemBrandingController],
})
export class SystemBrandingModule {}
