export class PermissionErrorTypes {
  static NOT_FOUND = 'DECK_NOT_FOUND';
  static ACCESS_DENIED = 'ACCESS_DENIED';
  static INVALID_ACTION = 'INVALID_ACTION';
  static UNAUTHORIZED = 'UNAUTHORIZED';
  static SYSTEM_ERROR = 'SYSTEM_ERROR';
}

export class DeckPermissionError extends Error {
  constructor(
    public type: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DeckPermissionError';
  }

  static notFound(deckId: string): DeckPermissionError {
    return new DeckPermissionError(
      PermissionErrorTypes.NOT_FOUND,
      `Deck not found: ${deckId}`,
      { deckId }
    );
  }

  static accessDenied(deckId: string, userId: string): DeckPermissionError {
    return new DeckPermissionError(
      PermissionErrorTypes.ACCESS_DENIED,
      `Access denied to deck: ${deckId}`,
      { deckId, userId }
    );
  }

  static invalidAction(action: string): DeckPermissionError {
    return new DeckPermissionError(
      PermissionErrorTypes.INVALID_ACTION,
      `Invalid action: ${action}`
    );
  }

  static unauthorized(): DeckPermissionError {
    return new DeckPermissionError(
      PermissionErrorTypes.UNAUTHORIZED,
      'No authenticated user'
    );
  }
}

export interface IPermissionErrorHandler {
  handleError(error: Error): never;
  wrapError(error: Error, context?: any): DeckPermissionError;
}

export class PermissionErrorHandler implements IPermissionErrorHandler {
  handleError(error: Error): never {
    if (error instanceof DeckPermissionError) {
      throw error;
    }
    
    throw this.wrapError(error);
  }

  wrapError(error: Error, context?: any): DeckPermissionError {
    return new DeckPermissionError(
      PermissionErrorTypes.SYSTEM_ERROR,
      error.message,
      { originalError: error, context }
    );
  }
}
