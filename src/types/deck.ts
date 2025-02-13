import { DBCard } from './card';

export type DeckType = 'main' | 'extra' | 'side';

export interface Deck {
  id: string;
  user_id: string;
  name: string;
  public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeckDetails extends Deck {
  main_deck_count: number;
  extra_deck_count: number;
  side_deck_count: number;
  bookmark_count: number;
  is_bookmarked: boolean;
}

export interface GetDecksParams {
  userId: string;
  bookmarked?: boolean;
  public?: boolean;
}

export interface DeckCard {
  id: string;
  deck_id: string;
  card_id: string;
  deck_type: DeckType;
  position: number;
  created_at: string;
  card?: DBCard;
}

export interface DeckWithCards extends DeckDetails {
  main_deck: DeckCard[];
  extra_deck: DeckCard[];
  side_deck: DeckCard[];
}

export interface CreateDeckInput {
  name: string;
}

export interface UpdateDeckInput {
  name?: string;
}

export interface AddCardToDeckInput {
  deck_id: string;
  card_id: string;
  deck_type: DeckType;
  position: number;
}

export interface UpdateDeckCardInput {
  deck_type?: DeckType;
  position?: number;
}
