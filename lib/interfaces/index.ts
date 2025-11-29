/**
 * Central export file for all interfaces
 * Makes imports cleaner: import { IUserRepository, IAuthService } from '@/lib/interfaces'
 */

export type { IRepository } from './IRepository';
export type { IUserRepository } from './IUserRepository';
export type { IQuestionRepository } from './IQuestionRepository';
export type { IAnswerRepository } from './IAnswerRepository';
export type { ITaskRepository } from './ITaskRepository';
export type { INoteRepository } from './INoteRepository';
export type { IAuthService } from './IAuthService';
export type { IUserService } from './IUserService';
export type { IQuestionService } from './IQuestionService';
export type { IEmbeddingService } from './IEmbeddingService';