import { IUserRepository } from '../interfaces/IUserRepository';
import { IAuthService } from '../interfaces/IAuthService';
import { hashPassword, verifyPassword, generateToken, setAuthToken, clearAuthToken } from '../auth';
import { User } from '../models/User';

/**
 * Service class for authentication operations
 * Handles business logic for user authentication
 * Implements IAuthService interface - follows Interface Segregation Principle (ISP)
 * Uses Dependency Injection - follows Dependency Inversion Principle (DIP)
 * Follows Single Responsibility Principle (SRP) - only handles authentication logic
 */
export class AuthService implements IAuthService {
  private userRepository: IUserRepository;

  constructor(userRepository?: IUserRepository) {
    // Dependency Injection - allows for testing with mock repositories
    // If not provided, create default implementation (backward compatibility)
    this.userRepository = userRepository || new (require('../repositories/UserRepository').UserRepository)();
  }

  /**
   * Register a new user
   */
  async signup(email: string, password: string, name?: string): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      name: name || null,
      role: 'STUDENT',
    });

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    // Set auth token cookie
    await setAuthToken(token);

    return { user, token };
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Find user with password
    const userData = await this.userRepository.findWithPassword(email);
    if (!userData) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await verifyPassword(password, userData.password);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = generateToken(userData.user.id, userData.user.email, userData.user.role);

    // Set auth token cookie
    await setAuthToken(token);

    return { user: userData.user, token };
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await clearAuthToken();
  }
}

