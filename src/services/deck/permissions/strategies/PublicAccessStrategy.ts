import { DeckAction, DeckPermissionResult } from '../../../../types/deck/permissions';
import { IPublicAccessStrategy, BasePermissionStrategy, IPermissionContext } from './interfaces';
import { DeckPermissionError } from '../errors';

export class PublicAccessStrategy extends BasePermissionStrategy implements IPublicAccessStrategy {
  readonly type = 'public';
  readonly priority = 50; // Lower priority than ownership

  private readonly allowedPublicActions: DeckAction[] = ['view'];

  constructor(context: IPermissionContext) {
    super(context);
  }

  async check(deckId: string, userId: string, action: DeckAction): Promise<DeckPermissionResult> {
    try {
      await this.validateUser(userId);

      // First check if the action is even allowed for public decks
      if (!this.allowedPublicActions.includes(action)) {
        return this.createResult(
          false,
          `Action '${action}' not allowed for public decks`
        );
      }

      const isPublic = await this.checkPublicStatus(deckId, action);
      
      return this.createResult(
        isPublic,
        isPublic ? undefined : 'Deck is not public'
      );
    } catch (error) {
      if (error instanceof DeckPermissionError) {
        return this.createResult(false, error.message);
      }
      throw this.context.errorHandler.wrapError(error, { deckId, userId, action });
    }
  }

  async checkPublicStatus(deckId: string, action: DeckAction): Promise<boolean> {
    try {
      const { data: deck, error } = await this.context.db
        .from('decks')
        .select('public')
        .eq('id', deckId)
        .single();

      if (error) {
        throw error;
      }

      if (!deck) {
        throw DeckPermissionError.notFound(deckId);
      }

      return deck.public;
    } catch (error) {
      if (error instanceof DeckPermissionError) {
        throw error;
      }
      throw this.context.errorHandler.wrapError(error, { deckId, action });
    }
  }

  getAllowedPublicActions(): DeckAction[] {
    return [...this.allowedPublicActions];
  }
}
