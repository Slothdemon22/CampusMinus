import { User } from './User';

/**
 * Question model class representing a question entity
 */
export class Question {
  public id: string;
  public title: string;
  public type: string;
  public description: string;
  public images: string[];
  public userId: string | null;
  public user: User | null;
  public createdAt: Date;
  public updatedAt: Date;
  public answerCount?: number;

  constructor(
    id: string,
    title: string,
    type: string,
    description: string,
    images: string[],
    userId: string | null,
    user: User | null,
    createdAt: Date,
    updatedAt: Date,
    answerCount?: number
  ) {
    this.id = id;
    this.title = title;
    this.type = type;
    this.description = description;
    this.images = images;
    this.userId = userId;
    this.user = user;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.answerCount = answerCount;
  }

  /**
   * Check if question has images
   */
  public hasImages(): boolean {
    return this.images.length > 0;
  }

  /**
   * Get author display name
   */
  public getAuthorName(): string {
    return this.user ? this.user.getDisplayName() : 'Deleted User';
  }

  /**
   * Check if question belongs to a user
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
      title: this.title,
      type: this.type,
      description: this.description,
      images: this.images,
      userId: this.userId,
      user: this.user?.toJSON() || null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      answerCount: this.answerCount,
    };
  }
}

