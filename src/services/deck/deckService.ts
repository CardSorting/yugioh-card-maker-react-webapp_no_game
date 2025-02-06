import { SupabaseClientWrapper } from './SupabaseClientWrapper';
import {
  DeckDetails,
  DeckWithCards,
  DeckCard,
  CreateDeckInput,
  UpdateDeckInput,
  AddCardToDeckInput,
  UpdateDeckCardInput,
  DeckType,
  GetDecksParams
} from '../../types/deck';
import { createDeckPermissionService, DeckPermissionService } from './permissions/DeckPermissionService';
import { SupabaseDeckRepository, DeckRepository, DeckCardRepository, SupabaseDeckCardRepository } from './DeckRepository';

// Initialize repositories
const repositoryClientWrapper = new SupabaseClientWrapper();
const deckRepository: DeckRepository = new SupabaseDeckRepository(repositoryClientWrapper);
const deckCardRepository: DeckCardRepository = new SupabaseDeckCardRepository(repositoryClientWrapper);

// Initialize permission service in a new scope to avoid TypeScript inference issues
const permissionService = (() => {
  return createDeckPermissionService();
})();

export const createDeck = async (input: CreateDeckInput): Promise<DeckDetails | null> => {
  return deckRepository.createDeck(input);
};

export const updateDeck = async (id: string, input: UpdateDeckInput): Promise<DeckDetails | null> => {
  // Check edit permission
  const permissionResult = await permissionService.checkPermission(id, "edit");
  if (!permissionResult.allowed) {
    console.error('Permission denied:', permissionResult.reason);
    return null;
  }

  return deckRepository.updateDeck(id, input);
};

export const deleteDeck = async (id: string): Promise<boolean> => {
  // Check delete permission
  const permissionResult = await permissionService.checkPermission(id, "delete");
  if (!permissionResult.allowed) {
    console.error('Permission denied:', permissionResult.reason);
    return false;
  }

  return deckRepository.deleteDeck(id);
};

export const getDeckDetails = async (id: string): Promise<DeckWithCards | null> => {
  // Check view permission
  const permissionResult = await permissionService.checkPermission(id, "view");
  if (!permissionResult.allowed) {
    console.error('Permission denied:', permissionResult.reason);
    return null;
  }

  return deckRepository.getDeckDetails(id);
};

export const getUserDecks = async (params?: GetDecksParams): Promise<DeckDetails[]> => {
  return deckRepository.getUserDecks(params);
};

export const toggleDeckPublic = async (deckId: string): Promise<boolean> => {
  // Check edit permission
  const permissionResult = await permissionService.checkPermission(deckId, "edit");
  if (!permissionResult.allowed) {
    console.error('Permission denied:', permissionResult.reason);
    return false;
  }

  return deckRepository.toggleDeckPublic(deckId);
};

export const toggleDeckBookmark = async (deckId: string): Promise<boolean> => {
  // Check view permission (needed to bookmark)
  const permissionResult = await permissionService.checkPermission(deckId, "view");
  if (!permissionResult.allowed) {
    console.error('Permission denied:', permissionResult.reason);
    return false;
  }

  return deckRepository.toggleDeckBookmark(deckId);
};

export const addCardToDeck = async (input: AddCardToDeckInput): Promise<DeckCard | null> => {
  return deckCardRepository.addCardToDeck(input);
};

export const removeCardFromDeck = async (deckId: string, cardId: string): Promise<boolean> => {
  return deckCardRepository.removeCardFromDeck(deckId, cardId);
};

export const updateDeckCard = async (
  deckId: string,
  cardId: string,
  input: UpdateDeckCardInput
): Promise<DeckCard | null> => {
  return deckCardRepository.updateDeckCard(deckId, cardId, input);
};

export const reorderDeckCards = async (
  deckId: string,
  deckType: DeckType,
  cardIds: string[]
): Promise<boolean> => {
  return deckCardRepository.reorderDeckCards(deckId, deckType, cardIds);
};
