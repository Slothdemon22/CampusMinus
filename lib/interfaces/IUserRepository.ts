import { IRepository } from './IRepository';
import { User } from '../models/User';
import { UserRole } from '@prisma/client';

/**
 * User repository interface
 * Follows Interface Segregation Principle - specific methods for User entity
 */
export interface IUserRepository extends Omit<IRepository<User>, 'create'> {
  create(data: {
    email: string;
    password: string;
    name?: string | null;
    role?: UserRole;
  }): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findByRole(role: UserRole): Promise<User[]>;
  updateRole(id: string, role: UserRole): Promise<User>;
  findWithPassword(email: string): Promise<{ user: User; password: string } | null>;
}

