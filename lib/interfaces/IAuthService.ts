import { User } from '../models/User';

/**
 * Authentication service interface
 * Follows Interface Segregation Principle - only auth-related methods
 */
export interface IAuthService {
  signup(email: string, password: string, name?: string): Promise<{ user: User; token: string }>;
  login(email: string, password: string): Promise<{ user: User; token: string }>;
  logout(): Promise<void>;
}


