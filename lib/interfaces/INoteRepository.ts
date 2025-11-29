import { IRepository } from './IRepository';
import { Note } from '../models/Note';

/**
 * Note repository interface
 * Follows Interface Segregation Principle - specific methods for Note entity
 */
export interface INoteRepository extends IRepository<Note> {
  findByUserId(userId: string): Promise<Note[]>;
  findByShareToken(token: string): Promise<Note | null>;
  enableSharing(id: string): Promise<Note>;
  disableSharing(id: string): Promise<Note>;
}

