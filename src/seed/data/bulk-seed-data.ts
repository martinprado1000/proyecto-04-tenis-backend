import { Sexo } from 'src/users/enums/role.enums';

export interface BulkSeedUser {
  name: string;
  lastname: string;
  sexo: Sexo;
  telefono: string;
  categoria: string;
}

export const bulkSeedUsers: BulkSeedUser[] = [
  { name: 'Lucas', lastname: 'Gómez', sexo: Sexo.MASCULINO, telefono: '+5493415510000', categoria: 'A' },
  { name: 'Mateo', lastname: 'Pérez', sexo: Sexo.MASCULINO, telefono: '+5493415510001', categoria: 'B' },
  { name: 'Santiago', lastname: 'Ríos', sexo: Sexo.MASCULINO, telefono: '+5493415510002', categoria: 'C' },
  { name: 'Tomás', lastname: 'Duarte', sexo: Sexo.MASCULINO, telefono: '+5493415510003', categoria: 'D' },
  { name: 'Bruno', lastname: 'Suárez', sexo: Sexo.MASCULINO, telefono: '+5493415510004', categoria: 'E' },
  { name: 'Nicolás', lastname: 'Molina', sexo: Sexo.MASCULINO, telefono: '+5493415510005', categoria: 'A' },
  { name: 'Martina', lastname: 'Vega', sexo: Sexo.FEMENINO, telefono: '+5493415510006', categoria: 'B' },
  { name: 'Sofía', lastname: 'Sosa', sexo: Sexo.FEMENINO, telefono: '+5493415510007', categoria: 'C' },
  { name: 'Camila', lastname: 'Cabrera', sexo: Sexo.FEMENINO, telefono: '+5493415510008', categoria: 'D' },
  { name: 'Valentina', lastname: 'Ferreyra', sexo: Sexo.FEMENINO, telefono: '+5493415510009', categoria: 'E' },
  { name: 'Agustín', lastname: 'Navarro', sexo: Sexo.MASCULINO, telefono: '+5493415510010', categoria: 'A' },
  { name: 'Joaquín', lastname: 'Acosta', sexo: Sexo.MASCULINO, telefono: '+5493415510011', categoria: 'B' },
  { name: 'Franco', lastname: 'Luna', sexo: Sexo.MASCULINO, telefono: '+5493415510012', categoria: 'C' },
  { name: 'Emilia', lastname: 'Ponce', sexo: Sexo.FEMENINO, telefono: '+5493415510013', categoria: 'D' },
  { name: 'Julieta', lastname: 'Medina', sexo: Sexo.FEMENINO, telefono: '+5493415510014', categoria: 'E' },
  { name: 'Facundo', lastname: 'Castro', sexo: Sexo.MASCULINO, telefono: '+5493415510015', categoria: 'A' },
  { name: 'Mía', lastname: 'Herrera', sexo: Sexo.FEMENINO, telefono: '+5493415510016', categoria: 'B' },
  { name: 'Thiago', lastname: 'Romero', sexo: Sexo.MASCULINO, telefono: '+5493415510017', categoria: 'C' },
  { name: 'Renata', lastname: 'Silva', sexo: Sexo.FEMENINO, telefono: '+5493415510018', categoria: 'D' },
  { name: 'Benjamín', lastname: 'Torres', sexo: Sexo.MASCULINO, telefono: '+5493415510019', categoria: 'E' },
  { name: 'Malena', lastname: 'Vargas', sexo: Sexo.FEMENINO, telefono: '+5493415510020', categoria: 'A' },
  { name: 'Gonzalo', lastname: 'Méndez', sexo: Sexo.MASCULINO, telefono: '+5493415510021', categoria: 'B' },
  { name: 'Victoria', lastname: 'Quiroga', sexo: Sexo.FEMENINO, telefono: '+5493415510022', categoria: 'C' },
  { name: 'Ramiro', lastname: 'Aguirre', sexo: Sexo.MASCULINO, telefono: '+5493415510023', categoria: 'D' },
  { name: 'Florencia', lastname: 'Benítez', sexo: Sexo.FEMENINO, telefono: '+5493415510024', categoria: 'E' },
];
