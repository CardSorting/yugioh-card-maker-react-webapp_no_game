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
import { DBCard } from '../../types/card';

export interface DeckRepository {
  createDeck(input: CreateDeckInput): Promise<DeckDetails | null>;
  updateDeck(id: string, input: UpdateDeckInput): Promise<DeckDetails | null>;
  deleteDeck(id: string): Promise<boolean>;
  getDeckDetails(id: string): Promise<DeckWithCards | null>;
  getUserDecks(params?: GetDecksParams): Promise<DeckDetails[]>;
  toggleDeckPublic(deckId: string): Promise<boolean>;
  toggleDeckBookmark(deckId: string): Promise<boolean>;
}

export interface DeckCardRepository {
  addCardToDeck(input: AddCardToDeckInput): Promise<DeckCard | null>;
  removeCardFromDeck(deckId: string, cardId: string): Promise<boolean>;
  updateDeckCard(deckId: string, cardId: string, input: UpdateDeckCardInput): Promise<DeckCard | null>;
  reorderDeckCards(deckId: string, deckType: DeckType, cardIds: string[]): Promise<boolean>;
}


const DECK_TABLE = 'decks';
const DECK_CARDS_TABLE = 'deck_cards';
const DECK_DETAILS_VIEW = 'deck_details';

export class SupabaseDeckRepository implements DeckRepository {
  private client: SupabaseClientWrapper;

  constructor(client: SupabaseClientWrapper) {
    this.client = client;
  }

  async createDeck(input: CreateDeckInput): Promise<DeckDetails | null> {
    const auth = this.client.auth();
    const from = this.client.from(DECK_TABLE);
    const detailsFrom = this.client.from(DECK_DETAILS_VIEW);

    const { data: { session } } = await auth.getSession();
    if (!session?.user) {
      console.error('No authenticated user');
      return null;
    }

    const { data: deck, error } = await from
      .insert({
        name: input.name,
        user_id: session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating deck:', error);
      return null;
    }

    // Get deck details
    const { data: deckDetails, error: detailsError } = await detailsFrom
      .select()
      .eq('id', deck.id)
      .single();

    if (detailsError) {
      console.error('Error fetching deck details:', detailsError);
      return null;
    }

    return deckDetails;
  }

  async updateDeck(id: string, input: UpdateDeckInput): Promise<DeckDetails | null> {
    const from = this.client.from(DECK_TABLE);
    const detailsFrom = this.client.from(DECK_DETAILS_VIEW);

    const { error } = await from
      .update(input)
      .eq('id', id);

    if (error) {
      console.error('Error updating deck:', error);
      return null;
    }

    // Get updated deck details
    const { data: deckDetails, error: detailsError } = await detailsFrom
      .select()
      .eq('id', id)
      .single();

    if (detailsError) {
      console.error('Error fetching updated deck details:', detailsError);
      return null;
    }

    return deckDetails;
  }

  async deleteDeck(id: string): Promise<boolean> {
    const from = this.client.from(DECK_TABLE);

    const { error } = await from
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting deck:', error);
      return false;
    }

    return true;
  }

  async getDeckDetails(id: string): Promise<DeckWithCards | null> {
    const detailsFrom = this.client.from('deck_details');
    const cardsFrom = this.client.from(DECK_CARDS_TABLE);
    // Get deck details with counts
    const { data: deckDetails, error: detailsError } = await detailsFrom
      .select()
      .eq('id', id)
      .single();

    if (detailsError) {
      console.error('Error fetching deck details:', detailsError);
      return null;
    }

    if (!deckDetails) {
      console.error('No deck details found:', {
        deckId: id
      });
      return null;
    }

    interface DeckCardResponse {
      id: string;
      deck_id: string;
      card_id: string;
      deck_type: DeckType;
      position: number;
      created_at: string;
      card: DBCard | null;
    }

    // Get deck cards with card details
    const { data: deckCards, error: cardsError } = await cardsFrom
      .select(`
        id,
        deck_id,
        card_id,
        deck_type,
        position,
        created_at,
        card:cards!inner (
          id,
          cardTitle:card_title,
          cardType:card_type,
          cardAttr:card_attribute,
          cardRace:card_race,
          cardLevel:card_level,
          cardATK:card_atk,
          cardDEF:card_def,
          card_image_path,
          created_at,
          user_id,
          uiLang:ui_lang,
          cardLang:card_lang,
          holo,
          cardRare:card_rare,
          cardSubtype:card_subtype,
          cardEff1:card_effect_1,
          cardEff2:card_effect_2,
          cardCustomRaceEnabled:custom_race_enabled,
          cardCustomRace:custom_race,
          Pendulum:is_pendulum,
          Special:is_special,
          cardBLUE:pendulum_blue,
          cardRED:card_red,
          pendulumSize:pendulum_size,
          cardPendulumInfo:card_pendulum_info,
          links,
          infoSize:info_size,
          cardInfo:card_info
        ),
        social:card_social_features!inner (
          likes_count,
          comments_count,
          is_liked,
          is_bookmarked,
          creator_username,
          creator_profile_image
        )
      `)
      .eq('deck_id', id)
      .order('position', { ascending: true });

    if (cardsError) {
      console.error('Error fetching deck cards:', cardsError);
      return null;
    }

    // Organize cards by deck type
    const mainDeck = (deckCards || [])
      .filter((card: DeckCardResponse): card is DeckCardResponse => card.deck_type === 'main' && card.card !== null)
      .map((card: DeckCardResponse): DeckCard | null => { // Explicit type annotation here
        if (!card.card) return null;
        return {
          id: card.id,
          deck_id: card.deck_id,
          card_id: card.card_id,
          deck_type: card.deck_type,
          position: card.position,
          created_at: card.created_at,
        card: card.card as DBCard
        } as DeckCard;
      }).filter((card: DeckCard | null): card is DeckCard => card !== null) as DeckCard[];


    const extraDeck = (deckCards || [])
      .filter((card: DeckCardResponse): card is DeckCardResponse => card.deck_type === 'extra' && card.card !== null)
      .map((card: DeckCardResponse): DeckCard | null => { // Explicit type annotation here
        if (!card.card) return null;
        return {
          id: card.id,
          deck_id: card.deck_id,
          card_id: card.card_id,
          deck_type: card.deck_type,
          position: card.position,
          created_at: card.created_at,
        card: card.card as DBCard
        } as DeckCard;
      }).filter((card: DeckCard | null): card is DeckCard => card !== null) as DeckCard[];

    const sideDeck = (deckCards || [])
      .filter((card: DeckCardResponse): card is DeckCardResponse => card.deck_type === 'side' && card.card !== null)
      .map((card: DeckCardResponse): DeckCard | null => { // Explicit type annotation here
        if (!card.card) return null;
        return {
          id: card.id,
          deck_id: card.deck_id,
          card_id: card.card_id,
          deck_type: card.deck_type,
          position: card.position,
          created_at: card.created_at,
        card: card.card as DBCard
        } as DeckCard;
      }).filter((card: DeckCard | null): card is DeckCard => card !== null) as DeckCard[];

    return {
      ...deckDetails,
      main_deck: mainDeck,
      extra_deck: extraDeck,
      side_deck: sideDeck
    };
  }

  async getUserDecks(params?: GetDecksParams): Promise<DeckDetails[]> {
    const auth = this.client.auth();
    const detailsFrom = this.client.from('deck_details');
    const { data: { session } } = await auth.getSession();
    if (!session?.user) {
      console.error('No authenticated user');
      return [];
    }

    let query = detailsFrom
      .select();

    if (params?.bookmarked) {
      query = query
        .eq('is_bookmarked', true)
        .order('bookmark_count', { ascending: false });
    } else if (params?.public) {
      query = query
        .eq('public', true)
        .order('bookmark_count', { ascending: false });
    } else {
      query = query
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false });
    }

    const { data: decks, error } = await query;

    if (error) {
      console.error('Error fetching user decks:', error, {
        userId: session.user.id
      });
      return [];
    }

    return decks || [];
  }

  async toggleDeckPublic(deckId: string): Promise<boolean> {
    const from = this.client.from('decks');
    const { data: deck, error: getError } = await from
      .select('public')
      .eq('id', deckId)
      .single();

    if (getError) {
      console.error('Error fetching deck:', getError);
      return false;
    }

    const { error: updateError } = await this.client.from('decks')
      .update({ public: !deck.public })
      .eq('id', deckId);

    if (updateError) {
      console.error('Error updating deck public status:', updateError);
      return false;
    }

    return true;
  }

  async toggleDeckBookmark(deckId: string): Promise<boolean> {
    const auth = this.client.auth();
    const bookmarksFrom = this.client.from('deck_bookmarks');
    const { data: { session } } = await auth.getSession();
    if (!session?.user) {
      console.error('No authenticated user');
      return false;
    }

    const { data: bookmark } = await bookmarksFrom
      .select('id')
      .eq('deck_id', deckId)
      .eq('user_id', session.user.id)
      .single();

    if (bookmark) {
      // Remove bookmark
      const { error } = await this.client.from('deck_bookmarks')
        .delete()
        .eq('deck_id', deckId)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error removing bookmark:', error);
        return false;
      }
    } else {
      // Add bookmark
      const { error } = await this.client.from('deck_bookmarks')
        .insert({
          deck_id: deckId,
          user_id: session.user.id
        });

      if (error) {
        console.error('Error adding bookmark:', error);
        return false;
      }
    }

    return true;
  }
}

export class SupabaseDeckCardRepository implements DeckCardRepository {
  async addCardToDeck(_input: AddCardToDeckInput): Promise<DeckCard | null> {
    throw new Error('Method not implemented.');
  }
  async removeCardFromDeck(_deckId: string, _cardId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  async updateDeckCard(_deckId: string, _cardId: string, _input: UpdateDeckCardInput): Promise<DeckCard | null> {
    throw new Error('Method not implemented.');
  }
  async reorderDeckCards(_deckId: string, _deckType: DeckType, _cardIds: string[]): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
