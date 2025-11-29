import { User } from './User';

/**
 * Answer model class representing an answer entity
 */
export class Answer {
  public id: string;
  public description: string;
  public images: string[];
  public questionId: string;
  public userId: string;
  public user: User;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(
    id: string,
    description: string,
    images: string[],
    questionId: string,
    userId: string,
    user: User,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.description = description;
    this.images = images;
    this.questionId = questionId;
    this.userId = userId;
    this.user = user;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Check if answer has images
   */
  public hasImages(): boolean {
    return this.images.length > 0;
  }

  /**
   * Get author display name
   */
  public getAuthorName(): string {
    return this.user.getDisplayName();
  }

  /**
   * Check if answer belongs to a user
   */
  public belongsTo(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Convert to plain object
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      description: this.description,
      images: this.images,
      questionId: this.questionId,
      userId: this.userId,
      user: this.user.toJSON(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

