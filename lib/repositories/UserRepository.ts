import { BaseRepository } from './BaseRepository';
import { User } from '../models/User';
import { UserRole } from '@prisma/client';
import { IUserRepository } from '../interfaces/IUserRepository';

/**
 * Repository class for User entity operations
 * Handles all database interactions for users
 * Implements IUserRepository interface - follows Interface Segregation Principle (ISP)
 * Follows Single Responsibility Principle (SRP) - only handles user data access
 */
export class UserRepository extends BaseRepository<User> implements IUserRepository {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    await this.initialize();
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return new User(
      user.id,
      user.email,
      user.name,
      user.role as 'STUDENT' | 'ADMIN',
      user.createdAt,
      user.updatedAt
    );
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    await this.initialize();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) return null;

    return new User(
      user.id,
      user.email,
      user.name,
      user.role as 'STUDENT' | 'ADMIN',
      user.createdAt,
      user.updatedAt
    );
  }

  /**
   * Find all users
   */
  async findAll(): Promise<User[]> {
    await this.initialize();
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map(
      (user) =>
        new User(
          user.id,
          user.email,
          user.name,
          user.role as 'STUDENT' | 'ADMIN',
          user.createdAt,
          user.updatedAt
        )
    );
  }

  /**
   * Find users by role
   */
  async findByRole(role: UserRole): Promise<User[]> {
    await this.initialize();
    const users = await this.prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(
      (user) =>
        new User(
          user.id,
          user.email,
          user.name,
          user.role as 'STUDENT' | 'ADMIN',
          user.createdAt,
          user.updatedAt
        )
    );
  }

  /**
   * Create a new user
   */
  async create(data: {
    email: string;
    password: string;
    name?: string | null;
    role?: UserRole;
  }): Promise<User> {
    await this.initialize();
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name || null,
        role: data.role || 'STUDENT',
      },
    });

    return new User(
      user.id,
      user.email,
      user.name,
      user.role as 'STUDENT' | 'ADMIN',
      user.createdAt,
      user.updatedAt
    );
  }

  /**
   * Update user by ID
   */
  async update(id: string, data: Partial<User>): Promise<User> {
    await this.initialize();
    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role) updateData.role = data.role;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return new User(
      user.id,
      user.email,
      user.name,
      user.role as 'STUDENT' | 'ADMIN',
      user.createdAt,
      user.updatedAt
    );
  }

  /**
   * Update user role
   */
  async updateRole(id: string, role: UserRole): Promise<User> {
    await this.initialize();
    const user = await this.prisma.user.update({
      where: { id },
      data: { role },
    });

    return new User(
      user.id,
      user.email,
      user.name,
      user.role as 'STUDENT' | 'ADMIN',
      user.createdAt,
      user.updatedAt
    );
  }

  /**
   * Delete user by ID
   */
  async delete(id: string): Promise<void> {
    await this.initialize();
    // Before deleting, set all questions' userId to null
    await this.prisma.question.updateMany({
      where: { userId: id },
      data: { userId: null },
    });

    await this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Get user with password (for authentication)
   */
  async findWithPassword(email: string): Promise<{ user: User; password: string } | null> {
    await this.initialize();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) return null;

    return {
      user: new User(
        user.id,
        user.email,
        user.name,
        user.role as 'STUDENT' | 'ADMIN',
        user.createdAt,
        user.updatedAt
      ),
      password: user.password,
    };
  }
}

