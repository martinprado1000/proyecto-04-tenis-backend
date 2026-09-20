// import { Injectable, NotFoundException } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Organization } from './schemas/organization.schema';

// @Injectable()
// export class OrganizationsService {
//   constructor(@InjectModel(Organization.name) private orgModel: Model<Organization>) {}

//   async create(payload: Partial<Organization>) {
//     return await this.orgModel.create(payload);
//   }

//   async findAll() {
//     return await this.orgModel.find().exec();
//   }

//   async findBySlug(slug: string) {
//     return await this.orgModel.findOne({ slug }).exec();
//   }

//   async findById(id: string) {
//     return await this.orgModel.findById(id).exec();
//   }

//   async update(id: string, payload: Partial<Organization>) {
//     const updated = await this.orgModel.findByIdAndUpdate(id, payload, { new: true }).exec();
//     if (!updated) throw new NotFoundException('Organization not found');
//     return updated;
//   }

// }


import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';

import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization } from './schemas/organization.schema';
import { User } from 'src/users/schemas/user.schema';
import { Role } from 'src/users/enums/role.enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<Organization>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) { }

  async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    const createdOrganization = new this.organizationModel(createOrganizationDto);
    return await createdOrganization.save();
  }

  async createWithAdmin(payload: any): Promise<Organization> {
    const slug = String(payload.slug || payload.name || '')
      .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!payload.name || !slug || !payload.adminName || !payload.email || !payload.password) {
      throw new BadRequestException('Completá nombre, responsable, email y contraseña.');
    }
    if (await this.organizationModel.exists({ slug })) throw new BadRequestException('El slug ya está en uso.');
    if (await this.userModel.exists({ email: String(payload.email).toLowerCase() })) throw new BadRequestException('Ya existe un usuario con ese email.');

    const organization = await this.organizationModel.create({
      name: payload.name.trim(),
      slug,
      email: String(payload.email).trim().toLowerCase(),
      logoUrl: payload.logoUrl,
      plan: payload.plan || 'FREE',
      isActive: true,
    });
    try {
      const nameParts = String(payload.adminName || '').trim().split(/\s+/).filter(Boolean);
      if (nameParts.length < 2) {
        throw new BadRequestException('Debes ingresar nombre y apellido del responsable.');
      }
      const firstName = nameParts.shift() || 'Administrador';
      const lastName = nameParts.join(' ');
      await this.userModel.create({
        name: firstName,
        lastname: lastName,
        email: String(payload.email).toLowerCase(),
        password: await bcrypt.hash(payload.password, 10),
        roles: [Role.ADMIN],
        sexo: payload.sexo || 'MASCULINO',
        isActive: true,
        organizationId: organization._id,
      });
      return organization;
    } catch (error) {
      await this.organizationModel.findByIdAndDelete(organization._id);
      throw error;
    }
  }

  async findAll(): Promise<any[]> {
    const orgs = await this.organizationModel.find().lean().exec();
    const result = await Promise.all(
      orgs.map(async (org) => {
        let adminUser = await this.userModel.findOne({
          organizationId: org._id,
          roles: Role.ADMIN,
        }).lean().exec();

        if (!adminUser) {
          adminUser = await this.userModel.findOne({
            organizationId: org._id,
          }).lean().exec();
        }

        const adminName = adminUser
          ? `${adminUser.name || ''}${adminUser.lastname ? ' ' + adminUser.lastname : ''}`.trim()
          : '';

        return {
          ...org,
          adminName,
        };
      })
    );
    return result;
  }

  async findOne(id: string): Promise<Organization> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Invalid ID format: ${id}`);
    }
    const organization = await this.organizationModel.findById(id).exec();
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    return organization;
  }

  // MÉTODO IMPORTANTE: Buscador por slug para el controlador
  async findBySlug(slug: string): Promise<any> {
    const normalizedSlug = String(slug || '').trim().toLowerCase();
    const organization = await this.organizationModel.findOne({
      $or: [{ slug: normalizedSlug }, { slug: slug }, { name: new RegExp(`^${String(slug).replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`, 'i') }],
    }).lean().exec();
    if (!organization) {
      throw new NotFoundException(`Organization with slug ${slug} not found`);
    }

    let adminUser = await this.userModel.findOne({
      organizationId: organization._id,
      roles: Role.ADMIN,
    }).lean().exec();

    if (!adminUser) {
      adminUser = await this.userModel.findOne({
        organizationId: organization._id,
      }).lean().exec();
    }

    const adminName = adminUser
      ? `${adminUser.name || ''}${adminUser.lastname ? ' ' + adminUser.lastname : ''}`.trim()
      : '';

    return { ...organization, adminName };
  }

  async update(id: string, updateOrganizationDto: any): Promise<Organization> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Invalid ID format: ${id}`);
    }
    if (updateOrganizationDto.slug) {
      const duplicate = await this.organizationModel.findOne({
        slug: updateOrganizationDto.slug,
        _id: { $ne: id },
      }).exec();
      if (duplicate) throw new BadRequestException('El slug ya está en uso.');
    }

    const { adminName, ...orgData } = updateOrganizationDto;

    if (adminName !== undefined && adminName !== null) {
      const nameParts = String(adminName || '').trim().split(/\s+/).filter(Boolean);
      if (nameParts.length < 2) {
        throw new BadRequestException('Debes ingresar nombre y apellido del responsable.');
      }
    }

    const updatedOrganization = await this.organizationModel
      .findByIdAndUpdate(id, orgData, { new: true })
      .exec();

    if (!updatedOrganization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    if (adminName !== undefined && adminName !== null) {
      const nameParts = String(adminName || '').trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts.shift() || 'Administrador';
      const lastName = nameParts.join(' ');

      let adminUser = await this.userModel.findOne({
        organizationId: id,
        roles: Role.ADMIN,
      }).exec();

      if (!adminUser) {
        adminUser = await this.userModel.findOne({
          organizationId: id,
        }).exec();
      }

      if (adminUser) {
        adminUser.name = firstName;
        adminUser.lastname = lastName;
        await adminUser.save();
      }
    }

    return updatedOrganization;
  }

  async remove(id: string): Promise<Organization> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Invalid ID format: ${id}`);
    }
    const protectedOrganization = await this.organizationModel.findOne({ _id: id, isProtected: true }).exec();
    if (protectedOrganization) {
      throw new BadRequestException('Esta organización está protegida y no puede eliminarse.');
    }
    const deletedOrganization = await this.organizationModel.findByIdAndDelete(id).exec();
    if (!deletedOrganization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    return deletedOrganization;
  }

  // Método para limpiar la base en el seed
  async removeAllOrganizations() {
    return await this.organizationModel.deleteMany({});
  }
}
