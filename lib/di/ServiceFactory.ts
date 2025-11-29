/**
 * Service Factory - Dependency Injection Container
 * Follows Dependency Inversion Principle (DIP)
 * Provides centralized creation of services with their dependencies
 * 
 * This factory pattern allows for easy testing and swapping of implementations
 */
import { IUserRepository } from '../interfaces/IUserRepository';
import { IQuestionRepository } from '../interfaces/IQuestionRepository';
import { IAnswerRepository } from '../interfaces/IAnswerRepository';
import { IEmbeddingService } from '../interfaces/IEmbeddingService';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { QuestionService } from '../services/QuestionService';
import { EmbeddingService } from '../services/EmbeddingService';
import { UserRepository } from '../repositories/UserRepository';
import { QuestionRepository } from '../repositories/QuestionRepository';
import { AnswerRepository } from '../repositories/AnswerRepository';

export class ServiceFactory {
  private static userRepository: IUserRepository | null = null;
  private static questionRepository: IQuestionRepository | null = null;
  private static answerRepository: IAnswerRepository | null = null;
  private static embeddingService: IEmbeddingService | null = null;

  /**
   * Get or create UserRepository instance (Singleton pattern)
   */
  static getUserRepository(): IUserRepository {
    if (!this.userRepository) {
      this.userRepository = new UserRepository();
    }
    return this.userRepository;
  }

  /**
   * Get or create QuestionRepository instance
   */
  static getQuestionRepository(): IQuestionRepository {
    if (!this.questionRepository) {
      this.questionRepository = new QuestionRepository();
    }
    return this.questionRepository;
  }

  /**
   * Get or create AnswerRepository instance
   */
  static getAnswerRepository(): IAnswerRepository {
    if (!this.answerRepository) {
      this.answerRepository = new AnswerRepository();
    }
    return this.answerRepository;
  }

  /**
   * Get or create EmbeddingService instance
   */
  static getEmbeddingService(): IEmbeddingService {
    if (!this.embeddingService) {
      this.embeddingService = new EmbeddingService();
    }
    return this.embeddingService;
  }

  /**
   * Create AuthService with dependencies
   */
  static createAuthService(): AuthService {
    return new AuthService(this.getUserRepository());
  }

  /**
   * Create UserService with dependencies
   */
  static createUserService(): UserService {
    return new UserService(this.getUserRepository());
  }

  /**
   * Create QuestionService with dependencies
   */
  static createQuestionService(): QuestionService {
    return new QuestionService(
      this.getQuestionRepository(),
      this.getAnswerRepository(),
      this.getEmbeddingService()
    );
  }

  /**
   * Reset all instances (useful for testing)
   */
  static reset(): void {
    this.userRepository = null;
    this.questionRepository = null;
    this.answerRepository = null;
    this.embeddingService = null;
  }
}

