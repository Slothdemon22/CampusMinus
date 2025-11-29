import { IQuestionRepository } from '../interfaces/IQuestionRepository';
import { IAnswerRepository } from '../interfaces/IAnswerRepository';
import { IEmbeddingService } from '../interfaces/IEmbeddingService';
import { IQuestionService } from '../interfaces/IQuestionService';
import { Question } from '../models/Question';
import { Answer } from '../models/Answer';

/**
 * Service class for Question operations
 * Handles business logic for questions
 * Implements IQuestionService interface - follows Interface Segregation Principle (ISP)
 * Uses Dependency Injection - follows Dependency Inversion Principle (DIP)
 * Follows Single Responsibility Principle (SRP) - only handles question business logic
 */
export class QuestionService implements IQuestionService {
  private questionRepository: IQuestionRepository;
  private answerRepository: IAnswerRepository;
  private embeddingService: IEmbeddingService;

  constructor(
    questionRepository?: IQuestionRepository,
    answerRepository?: IAnswerRepository,
    embeddingService?: IEmbeddingService
  ) {
    // Dependency Injection - allows for testing with mock dependencies
    // If not provided, create default implementations (backward compatibility)
    this.questionRepository = questionRepository || new (require('../repositories/QuestionRepository').QuestionRepository)();
    this.answerRepository = answerRepository || new (require('../repositories/AnswerRepository').AnswerRepository)();
    this.embeddingService = embeddingService || new (require('./EmbeddingService').EmbeddingService)();
  }

  /**
   * Get all questions
   */
  async getAllQuestions(): Promise<Question[]> {
    return await this.questionRepository.findAll();
  }

  /**
   * Get question by ID
   */
  async getQuestionById(id: string): Promise<Question | null> {
    return await this.questionRepository.findById(id);
  }

  /**
   * Get questions by user ID
   */
  async getQuestionsByUserId(userId: string): Promise<Question[]> {
    return await this.questionRepository.findByUserId(userId);
  }

  /**
   * Create a new question
   */
  async createQuestion(data: {
    title: string;
    type: string;
    description: string;
    images: string[];
    userId: string;
  }): Promise<Question> {
    // Generate embedding for semantic search
    let embedding: number[] | null = null;
    try {
      const embeddingText = `${data.title.trim()} ${data.description.trim()}`;
      embedding = await this.embeddingService.generateEmbedding(embeddingText);
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Continue without embedding
    }

    return await this.questionRepository.create({
      ...data,
      embedding,
    });
  }

  /**
   * Update question
   */
  async updateQuestion(id: string, data: Partial<Question>): Promise<Question> {
    return await this.questionRepository.update(id, data);
  }

  /**
   * Delete question (cascade deletes answers)
   */
  async deleteQuestion(id: string): Promise<void> {
    await this.questionRepository.delete(id);
  }

  /**
   * Search questions using semantic search
   */
  async searchQuestions(query: string, limit: number = 3): Promise<Question[]> {
    // Generate embedding for search query
    const searchEmbedding = await this.embeddingService.generateEmbedding(query);
    
    // Perform vector similarity search
    return await this.questionRepository.searchByEmbedding(searchEmbedding, limit);
  }

  /**
   * Get answers for a question
   */
  async getAnswersForQuestion(questionId: string): Promise<Answer[]> {
    return await this.answerRepository.findByQuestionId(questionId);
  }

  /**
   * Create an answer for a question
   */
  async createAnswer(data: {
    description: string;
    images: string[];
    questionId: string;
    userId: string;
  }): Promise<Answer> {
    // Verify question exists
    const question = await this.questionRepository.findById(data.questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    return await this.answerRepository.create(data);
  }

  /**
   * Delete an answer
   */
  async deleteAnswer(id: string): Promise<void> {
    await this.answerRepository.delete(id);
  }
}

