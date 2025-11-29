import { IEmbeddingService } from '../interfaces/IEmbeddingService';

/**
 * Service class for generating text embeddings
 * Handles AI embedding generation using Gemini API
 * Implements IEmbeddingService interface - follows Interface Segregation Principle (ISP)
 * Follows Single Responsibility Principle (SRP) - only handles embedding generation
 */
export class EmbeddingService implements IEmbeddingService {
  private readonly apiKey: string | undefined;
  private readonly model: string = 'text-embedding-004';
  private readonly dimensions: number = 768;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('AI is not configured. Missing GEMINI_API_KEY.');
    }

    if (!text || !text.trim()) {
      throw new Error('Text is required for embedding generation');
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:embedContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: `models/${this.model}`,
            content: {
              parts: [{ text: text.trim() }],
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', errorText);
        throw new Error('Failed to generate embedding');
      }

      const data = await response.json();
      const embedding = data.embedding?.values || data.embedding;

      if (!embedding || !Array.isArray(embedding)) {
        throw new Error('Invalid embedding response');
      }

      // Ensure correct dimensions
      if (embedding.length !== this.dimensions) {
        console.warn(`Expected ${this.dimensions} dimensions, got ${embedding.length}`);
        return embedding.slice(0, this.dimensions);
      }

      return embedding;
    } catch (error: any) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Get embedding dimensions
   */
  getDimensions(): number {
    return this.dimensions;
  }
}

