import { SupabaseClientWrapper } from '../SupabaseClientWrapper';
import { DeckAction, DeckPermissionResult } from '../../../types/deck/permissions';
import { IPermissionStrategy, IPermissionContext } from './strategies/interfaces';
import { OwnershipStrategy } from './strategies/OwnershipStrategy';
import { PublicAccessStrategy } from './strategies/PublicAccessStrategy';
import { SharingStrategy } from './strategies/SharingStrategy';
import { DeckPermissionError } from './errors';

export interface IDeckPermissionService {
  checkPermission(deckId: string, action: DeckAction): Promise<DeckPermissionResult>;
  getCachedPermissions(deckId: string): Promise<DeckAction[]>;
  invalidateCache(deckId: string): Promise<void>;
}

export class DeckPermissionService implements IDeckPermissionService {
  private strategies: IPermissionStrategy[];
  private permissionCache: Map<string, { permissions: DeckAction[]; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly context: IPermissionContext,
  ) {
    // Initialize strategies in priority order
    this.strategies = [
      new OwnershipStrategy(context),
      new SharingStrategy(context),
      new PublicAccessStrategy(context)
    ].sort((a, b) => b.priority - a.priority);

    this.permissionCache = new Map();
  }

  async checkPermission(deckId: string, action: DeckAction): Promise<DeckPermissionResult> {
    try {
      const userId = await this.context.getCurrentUserId();
      if (!userId) {
        throw DeckPermissionError.unauthorized();
      }

      // Try each strategy in order of priority
      for (const strategy of this.strategies) {
        const result = await strategy.check(deckId, userId, action);
        if (result.allowed) {
          // Cache successful permissions
          await this.cachePermissions(deckId, [action]);
          return result;
        }
        // If a strategy definitively denies access (e.g., finds the deck but denies access),
        // don't try other strategies
        if (result.reason && result.reason !== 'No shared access' && result.reason !== 'Deck is not public') {
          return result;
        }
      }

      // If we get here, no strategy allowed the action
      return {
        allowed: false,
        reason: `No permission strategy allowed the action '${action}'`
      };

    } catch (error) {
      if (error instanceof DeckPermissionError) {
        throw error;
      }
      throw this.context.errorHandler.wrapError(error, { deckId, action });
    }
  }

  async getCachedPermissions(deckId: string): Promise<DeckAction[]> {
    const cached = this.permissionCache.get(deckId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return [...cached.permissions];
    }
    return [];
  }

  async invalidateCache(deckId: string): Promise<void> {
    this.permissionCache.delete(deckId);
  }

  private async cachePermissions(deckId: string, permissions: DeckAction[]): Promise<void> {
    const existing = this.permissionCache.get(deckId);
    const newPermissions = existing
      ? [...new Set([...existing.permissions, ...permissions])]
      : permissions;

    this.permissionCache.set(deckId, {
      permissions: newPermissions,
      timestamp: Date.now()
    });
  }
}

// Factory function to create DeckPermissionService with default context
export function createDeckPermissionService(): DeckPermissionService {
  const clientWrapper = new SupabaseClientWrapper(); // Create client wrapper internally
  const context: IPermissionContext = {
    db: clientWrapper, // Passing clientWrapper as db context
    errorHandler: new (class DefaultErrorHandler {
      handleError(error: Error): never {
        throw error;
      }
      wrapError(error: Error, _context?: any): Error {
        return error;
      }
    })(),
    getCurrentUserId: async () => {
      const auth = clientWrapper.auth();
      const { data: { session } } = await auth.getSession();
      return session?.user?.id || null;
    }
  };

  return new DeckPermissionService(context);
}
