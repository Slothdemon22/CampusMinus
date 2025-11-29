import { IRepository } from './IRepository';
import { Question } from '../models/Question';

/**
 * Question repository interface
 * Follows Interface Segregation Principle - specific methods for Question entity
 */
export interface IQuestionRepository extends Omit<IRepository<Question>, 'create'> {
  create(data: {
    title: string;
    type: string;
    description: string;
    images: string[];
    userId: string;
    embedding?: number[] | null;
  }): Promise<Question>;
  findByUserId(userId: string): Promise<Question[]>;
  searchByEmbedding(embedding: number[], limit?: number): Promise<Question[]>;
}

