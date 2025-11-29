import { Question } from '../models/Question';
import { Answer } from '../models/Answer';

/**
 * Question service interface
 * Follows Interface Segregation Principle - only question-related methods
 */
export interface IQuestionService {
  getAllQuestions(): Promise<Question[]>;
  getQuestionById(id: string): Promise<Question | null>;
  getQuestionsByUserId(userId: string): Promise<Question[]>;
  createQuestion(data: {
    title: string;
    type: string;
    description: string;
    images: string[];
    userId: string;
  }): Promise<Question>;
  updateQuestion(id: string, data: Partial<Question>): Promise<Question>;
  deleteQuestion(id: string): Promise<void>;
  searchQuestions(query: string, limit?: number): Promise<Question[]>;
  getAnswersForQuestion(questionId: string): Promise<Answer[]>;
  createAnswer(data: {
    description: string;
    images: string[];
    questionId: string;
    userId: string;
  }): Promise<Answer>;
  deleteAnswer(id: string): Promise<void>;
}


