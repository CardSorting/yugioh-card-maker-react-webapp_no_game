import { DeckAction, DeckPermissionResult, DeckPermission } from '../../../../types/deck/permissions';
import { ISharingStrategy, BasePermissionStrategy, IPermissionContext } from './interfaces';
import { DeckPermissionError } from '../errors';

export class SharingStrategy extends BasePermissionStrategy implements ISharingStrategy {
  readonly type = 'sharing';
  readonly priority = 75; // Between ownership (100) and public (50)

  constructor(context: IPermissionContext) {
    super(context);
  }

  async check(deckId: string, userId: string, action: DeckAction): Promise<DeckPermissionResult> {
    try {
      await this.validateUser(userId);
      
      const sharedAccess = await this.checkSharedAccess(deckId, userId);
      
      if (!sharedAccess) {
        return this.createResult(false, 'No shared access');
      }

      const hasPermission = sharedAccess.permissions.includes(action);
      return this.createResult(
        hasPermission,
        hasPermission ? undefined : `Action '${action}' not allowed with current permissions`
      );
    } catch (error) {
      if (error instanceof DeckPermissionError) {
        return this.createResult(false, error.message);
      }
      throw this.context.errorHandler.wrapError(error, { deckId, userId, action });
    }
  }

  async checkSharedAccess(deckId: string, userId: string): Promise<DeckPermission | null> {
    try {
      const { data: permissions, error } = await this.context.db
        .from('deck_permissions')
        .select('*')
        .eq('deck_id', deckId)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw error;
      }

      if (!permissions) {
        return null;
      }

      return {
        deckId: permissions.deck_id,
        userId: permissions.user_id,
        permissions: permissions.permissions as DeckAction[],
        grantedAt: new Date(permissions.granted_at),
        grantedBy: permissions.granted_by
      };
    } catch (error) {
      if (error instanceof DeckPermissionError) {
        throw error;
      }
      throw this.context.errorHandler.wrapError(error, { deckId, userId });
    }
  }

  async shareDeck(
    deckId: string,
    grantedTo: string,
    grantedBy: string,
    actions: DeckAction[]
  ): Promise<void> {
    try {
      // First check if this user can share the deck
      const canShare = await this.check(deckId, grantedBy, 'share');
      if (!canShare.allowed) {
        throw DeckPermissionError.accessDenied(deckId, grantedBy);
      }

      const { error } = await this.context.db
        .from('deck_permissions')
        .upsert({
          deck_id: deckId,
          user_id: grantedTo,
          permissions: actions,
          granted_by: grantedBy,
          granted_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      if (error instanceof DeckPermissionError) {
        throw error;
      }
      throw this.context.errorHandler.wrapError(error, {
        deckId,
        grantedTo,
        grantedBy,
        actions
      });
    }
  }

  async revokeDeckAccess(deckId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.context.db
        .from('deck_permissions')
        .delete()
        .eq('deck_id', deckId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      if (error instanceof DeckPermissionError) {
        throw error;
      }
      throw this.context.errorHandler.wrapError(error, { deckId, userId });
    }
  }
}
