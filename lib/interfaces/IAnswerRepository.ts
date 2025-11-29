import { IRepository } from './IRepository';
import { Answer } from '../models/Answer';

/**
 * Answer repository interface
 * Follows Interface Segregation Principle - specific methods for Answer entity
 */
export interface IAnswerRepository extends IRepository<Answer> {
  findByQuestionId(questionId: string): Promise<Answer[]>;
}


