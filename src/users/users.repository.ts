import {
  Injectable,
} from '@nestjs/common';
import { Role } from './enums/role.enums';
import { InjectModel } from '@nestjs/mongoose';

import { Document as DocumentMongoose, Model } from 'mongoose';

import { User } from 'src/users/schemas/user.schema';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { UsersRepositoryInterface } from 'src/users/interfaces/users-repository.interface';

@Injectable()
export class UsersRepository implements UsersRepositoryInterface {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  // -----------FIND ALL---------------------------------------------------------------------------------
  async findAll(limit: number, offset: number): Promise<User[]> {
    return await this.userModel
      .find({ roles: { $ne: Role.SUPERADMIN } })  // Excluyo superadmin
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
  }

  // -----------FIND ALL USERS ACTIVE--------------------------------------------------------------------
  async findAllActiveUsers(limit: number, offset: number): Promise<User[]> {
    return await this.userModel
      .find({ isActive: true, roles: { $ne: Role.SUPERADMIN } }) // Excluyo superadmin
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
  }

  // -----------FIND BY ID-------------------------------------------------------------------------------
  async findById(id: string): Promise<DocumentMongoose | null> {
    return (await this.userModel.findById(id).lean()) as unknown as DocumentMongoose | null;
  }

  // -----------FIND BY EMAIL-------------------------------------------------------------------------------
  async findeByEmail(email: string): Promise<DocumentMongoose | null> {
    return (await this.userModel.findOne({ email }).lean()) as unknown as DocumentMongoose | null;
  }

  // -----------CREATE------------------------------------------------------------------------------------
  async create(createUserDto: CreateUserDto): Promise<User> {
    return (await this.userModel.create(createUserDto));
  }

  // -----------UPDATE-------------------------------------------------------------------------------
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    return await this.userModel.findByIdAndUpdate(id, updateUserDto, {
      new: true,
    });
  }

  // -----------DELETE-------------------------------------------------------------------------------
  async delete(id: string): Promise<DocumentMongoose | null> {
    return await this.userModel.findByIdAndDelete(id);
  }

  // -----------DELETE ALL USERS---------------------------------------------------------------------
  async deleteAllUsers() {
    await this.userModel.deleteMany();
  }
  // -----------DELETE COLLECTION USERS--------------------------------------------------------------
  async deleteUsersCollection() {
    await this.userModel.collection.drop();
  }
}
