import { User } from './User';

/**
 * Note model class representing a note entity
 */
export class Note {
  public id: string;
  public title: string;
  public content: any; // JSON content from rich text editor
  public userId: string;
  public user: User;
  public shareToken: string | null;
  public isPublic: boolean;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(
    id: string,
    title: string,
    content: any,
    userId: string,
    user: User,
    createdAt: Date,
    updatedAt: Date,
    shareToken: string | null = null,
    isPublic: boolean = false
  ) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.userId = userId;
    this.user = user;
    this.shareToken = shareToken;
    this.isPublic = isPublic;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Check if note has content
   */
  public hasContent(): boolean {
    if (!this.content) return false;
    if (typeof this.content === 'string') {
      return this.content.trim().length > 0;
    }
    if (typeof this.content === 'object') {
      return Object.keys(this.content).length > 0;
    }
    return false;
  }

  /**
   * Get plain text from content
   */
  public getPlainText(): string {
    if (typeof this.content === 'string') {
      return this.content
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    if (typeof this.content === 'object' && this.content.type === 'doc') {
      // Extract text from TipTap JSON structure
      const extractText = (node: any): string => {
        if (node.type === 'text') {
          return node.text || '';
        }
        if (node.content && Array.isArray(node.content)) {
          return node.content.map(extractText).join(' ');
        }
        return '';
      };
      return extractText(this.content).trim();
    }
    return '';
  }

  /**
   * Check if note belongs to a user
   */
  public belongsTo(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Check if note is shareable (has share token)
   */
  public isShareable(): boolean {
    return this.isPublic && this.shareToken !== null;
  }

  /**
   * Get shareable URL
   */
  public getShareUrl(baseUrl?: string): string | null {
    if (!this.shareToken) return null;
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}/notes/shared/${this.shareToken}`;
  }

  /**
   * Convert to plain object
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      userId: this.userId,
      user: this.user.toJSON(),
      shareToken: this.shareToken,
      isPublic: this.isPublic,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

