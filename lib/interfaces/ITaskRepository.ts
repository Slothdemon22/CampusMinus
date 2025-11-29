import { IRepository } from './IRepository';
import { Task } from '../models/Task';

/**
 * Task repository interface
 * Follows Interface Segregation Principle - specific methods for Task entity
 */
export interface ITaskRepository extends IRepository<Task> {
  findByUserId(userId: string): Promise<Task[]>;
  toggleCompletion(id: string): Promise<Task>;
}


