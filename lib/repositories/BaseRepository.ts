import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../prisma';
import { IRepository } from '../interfaces/IRepository';

/**
 * Base repository class providing common database operations
 * Follows Repository Pattern and implements IRepository interface
 * Follows Liskov Substitution Principle (LSP) - can be substituted with any IRepository implementation
 */
export abstract class BaseRepository<T> implements IRepository<T> {
  protected prisma: PrismaClient;

  constructor() {
    // Initialize prisma client - will be set in async method
    this.prisma = null as any;
  }

  /**
   * Initialize the repository with Prisma client
   * Must be called before using repository methods
   */
  protected async initialize(): Promise<void> {
    if (!this.prisma) {
      this.prisma = await getPrismaClient();
    }
  }

  /**
   * Find a record by ID
   */
  abstract findById(id: string): Promise<T | null>;

  /**
   * Find all records
   */
  abstract findAll(): Promise<T[]>;

  /**
   * Create a new record
   */
  abstract create(data: Partial<T>): Promise<T>;

  /**
   * Update a record by ID
   */
  abstract update(id: string, data: Partial<T>): Promise<T>;

  /**
   * Delete a record by ID
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Check if a record exists
   */
  async exists(id: string): Promise<boolean> {
    await this.initialize();
    const record = await this.findById(id);
    return record !== null;
  }
}

