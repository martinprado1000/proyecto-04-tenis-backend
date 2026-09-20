import { Controller, Get, Post, Body, Param, Patch, Delete, HttpCode } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { Auth } from 'src/auth/decorators';
import { ValidRoles } from 'src/auth/interfaces';

@Controller('super-admin/organizations')
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  @Get('public/:slug')
  async getPublic(@Param('slug') slug: string) {
    const organization = await this.orgService.findBySlug(slug);
    return { id: organization._id, name: organization.name, slug: organization.slug, logoUrl: organization.logoUrl, isActive: organization.isActive };
  }

  @Get()
  @Auth(ValidRoles.SUPERADMIN)
  async list() {
    return await this.orgService.findAll();
  }

  @Post()
  @Auth(ValidRoles.SUPERADMIN)
  async create(@Body() body: any) {
    return await this.orgService.createWithAdmin(body);
  }

  @Get(':slug')
  @Auth(ValidRoles.SUPERADMIN)
  async get(@Param('slug') slug: string) {
    return await this.orgService.findBySlug(slug);
  }

  @Patch(':id')
  @Auth(ValidRoles.SUPERADMIN)
  async update(@Param('id') id: string, @Body() body: any) {
    return await this.orgService.update(id, body);
  }

  @Delete(':id')
  @Auth(ValidRoles.SUPERADMIN)
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.orgService.remove(id);
  }

}
