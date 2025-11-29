import { IUserRepository } from '../interfaces/IUserRepository';
import { IUserService } from '../interfaces/IUserService';
import { User } from '../models/User';
import { UserRole } from '@prisma/client';

/**
 * Service class for User operations
 * Handles business logic for user management
 * Implements IUserService interface - follows Interface Segregation Principle (ISP)
 * Uses Dependency Injection - follows Dependency Inversion Principle (DIP)
 * Follows Single Responsibility Principle (SRP) - only handles user business logic
 */
export class UserService implements IUserService {
  private userRepository: IUserRepository;

  constructor(userRepository?: IUserRepository) {
    // Dependency Injection - allows for testing with mock repositories
    // If not provided, create default implementation (backward compatibility)
    this.userRepository = userRepository || new (require('../repositories/UserRepository').UserRepository)();
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: UserRole): Promise<User[]> {
    return await this.userRepository.findByRole(role);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return await this.userRepository.findById(id);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: UserRole, currentUserId: string): Promise<User> {
    // Prevent admin from changing their own role to STUDENT
    if (userId === currentUserId && role === 'STUDENT') {
      throw new Error('You cannot change your own role to STUDENT');
    }

    return await this.userRepository.updateRole(userId, role);
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string, currentUserId: string): Promise<void> {
    // Prevent admin from deleting themselves
    if (userId === currentUserId) {
      throw new Error('You cannot delete your own account');
    }

    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Delete user (repository handles question preservation)
    await this.userRepository.delete(userId);
  }

  /**
   * Create admin user
   */
  async createAdminUser(email: string, password: string, name?: string): Promise<User> {
    const hashedPassword = await require('../auth').hashPassword(password);
    
    return await this.userRepository.create({
      email,
      password: hashedPassword,
      name: name || null,
      role: 'ADMIN',
    });
  }
}

