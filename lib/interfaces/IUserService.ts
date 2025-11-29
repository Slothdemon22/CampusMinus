import { User } from '../models/User';
import { UserRole } from '@prisma/client';

/**
 * User service interface
 * Follows Interface Segregation Principle - only user management methods
 */
export interface IUserService {
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: UserRole): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUserRole(userId: string, role: UserRole, currentUserId: string): Promise<User>;
  deleteUser(userId: string, currentUserId: string): Promise<void>;
}


