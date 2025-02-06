import { DeckAction, DeckPermissionResult, DeckPermission } from '../../../../types/deck/permissions';
import { Database } from '../../../../types/supabase';

export interface IPermissionStrategy {
  /**
   * Unique identifier for the strategy type
   */
  readonly type: string;

  /**
   * Check if the given action is allowed
   */
  check(deckId: string, userId: string, action: DeckAction): Promise<DeckPermissionResult>;

  /**
   * Priority level of this strategy (higher numbers take precedence)
   */
  readonly priority: number;
}

export interface IOwnershipStrategy extends IPermissionStrategy {
  /**
   * Check if the user owns the deck
   */
  checkOwnership(deckId: string, userId: string): Promise<boolean>;
}

export interface IPublicAccessStrategy extends IPermissionStrategy {
  /**
   * Check if the deck is public and the action is allowed for public decks
   */
  checkPublicStatus(deckId: string, action: DeckAction): Promise<boolean>;
  
  /**
   * Get the list of allowed actions for public decks
   */
  getAllowedPublicActions(): DeckAction[];
}

export interface ISharingStrategy extends IPermissionStrategy {
  /**
   * Check if the deck has been shared with the user
   */
  checkSharedAccess(deckId: string, userId: string): Promise<DeckPermission | null>;
  
  /**
   * Share a deck with a user
   */
  shareDeck(deckId: string, grantedTo: string, grantedBy: string, actions: DeckAction[]): Promise<void>;
  
  /**
   * Remove sharing permissions for a user
   */
  revokeDeckAccess(deckId: string, userId: string): Promise<void>;
}

export interface IPermissionContext {
  db: Database;
  errorHandler: any; // Will be properly typed once we create the error handler
  getCurrentUserId(): Promise<string | null>;
}

/**
 * Factory for creating permission strategies
 */
export interface IPermissionStrategyFactory {
  createStrategy(type: string, context: IPermissionContext): IPermissionStrategy;
  getSupportedTypes(): string[];
}

/**
 * Base class for permission strategies to share common functionality
 */
export abstract class BasePermissionStrategy implements IPermissionStrategy {
  abstract readonly type: string;
  abstract readonly priority: number;

  constructor(protected context: IPermissionContext) {}

  abstract check(deckId: string, userId: string, action: DeckAction): Promise<DeckPermissionResult>;

  protected async validateUser(userId: string): Promise<void> {
    const currentUserId = await this.context.getCurrentUserId();
    if (!currentUserId || currentUserId !== userId) {
      throw this.context.errorHandler.unauthorized();
    }
  }

  protected createResult(allowed: boolean, reason?: string): DeckPermissionResult {
    return { allowed, reason };
  }
}
