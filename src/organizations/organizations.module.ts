import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Organization, OrganizationSchema } from './schemas/organization.schema';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { User, UserSchema } from 'src/users/schemas/user.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Organization.name, schema: OrganizationSchema },
    { name: User.name, schema: UserSchema },
  ])],
  providers: [OrganizationsService],
  controllers: [OrganizationsController],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
