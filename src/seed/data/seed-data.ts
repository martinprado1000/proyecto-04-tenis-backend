import * as dotenv from 'dotenv';
dotenv.config();
import { ConfigService } from '@nestjs/config';
const configService = new ConfigService();
const passwordSeedUsers = configService.get<string>('PASSWORD_SEED_USERS') as string;

import { Role, Sexo } from 'src/users/enums/role.enums';

interface SeedUser {
    _id?: string;
    name: string;
    lastname: string;
    email: string;
    password: string;
    confirmPassword: string;
    roles: Role[] | Role;
    isActive: boolean;
    sexo: Sexo;
}


interface SeedData {
    users: SeedUser[];
}


export const initialData: SeedData = {
    users: [
        {
            name: 'Superadmin',
            lastname: 'Sadmin',
            email: 'superadmin@gmail.com',
            password: 'Test123*',
            confirmPassword: 'Test123*',
            roles: Role.SUPERADMIN,
            isActive: true,
            sexo: Sexo.MASCULINO,
        },
        {
            name: 'admin',
            lastname: 'admin',
            email: 'admin@gmail.com',
            password: 'Test123*',
            confirmPassword: 'Test123*',
            roles: Role.ADMIN,
            isActive: true,
            sexo: Sexo.MASCULINO,
        },

    ]
}
