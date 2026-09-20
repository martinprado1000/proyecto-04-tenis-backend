import { Body, Controller, Get, Patch } from '@nestjs/common'
import { Auth } from 'src/auth/decorators'
import { ValidRoles } from 'src/auth/interfaces'
import { SystemBrandingService } from './system-branding.service'

@Controller('system-branding')
export class SystemBrandingController {
  constructor(private readonly service: SystemBrandingService) {}

  @Get()
  async get() {
    return this.service.get()
  }

  @Patch()
  @Auth(ValidRoles.SUPERADMIN)
  async update(@Body() body: { name?: string; logoUrl?: string }) {
    return this.service.update(body)
  }
}
