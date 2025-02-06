import { DeckAction, DeckPermissionResult } from '../../../../types/deck/permissions';
import { IOwnershipStrategy, BasePermissionStrategy, IPermissionContext } from './interfaces';
import { DeckPermissionError } from '../errors';

export class OwnershipStrategy extends BasePermissionStrategy implements IOwnershipStrategy {
  readonly type = 'ownership';
  readonly priority = 100; // Highest priority - ownership trumps all

  constructor(context: IPermissionContext) {
    super(context);
  }

  async check(deckId: string, userId: string, action: DeckAction): Promise<DeckPermissionResult> {
    try {
      await this.validateUser(userId);
      const isOwner = await this.checkOwnership(deckId, userId);

      if (isOwner) {
        return this.createResult(true);
      }

      return this.createResult(false, 'Not the deck owner');
    } catch (error) {
      if (error instanceof DeckPermissionError) {
        return this.createResult(false, error.message);
      }
      throw this.context.errorHandler.wrapError(error, { deckId, userId, action });
    }
  }

  async checkOwnership(deckId: string, userId: string): Promise<boolean> {
    try {
      const { data: deck, error } = await this.context.db
        .from('decks')
        .select('user_id')
        .eq('id', deckId)
        .single();

      if (error) {
        throw error;
      }

      if (!deck) {
        throw DeckPermissionError.notFound(deckId);
      }

      return deck.user_id === userId;
    } catch (error) {
      if (error instanceof DeckPermissionError) {
        throw error;
      }
      throw this.context.errorHandler.wrapError(error, { deckId, userId });
    }
  }

}
