export type DeckAction = 'view' | 'edit' | 'delete' | 'share';

export interface DeckPermissionResult {
  allowed: boolean;
  reason?: string;
}

export interface DeckPermission {
  deckId: string;
  userId: string;
  permissions: DeckAction[];
  grantedAt: Date;
  grantedBy: string;
}

export type PermissionValidationResponse = {
  valid: boolean;
  error?: string;
};
