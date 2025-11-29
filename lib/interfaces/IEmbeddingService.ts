/**
 * Embedding service interface
 * Follows Interface Segregation Principle - only embedding-related methods
 */
export interface IEmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  getDimensions(): number;
}


