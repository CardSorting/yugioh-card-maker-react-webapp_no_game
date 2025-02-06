import { SupabaseClientWrapper } from './SupabaseClientWrapper';
import {
  DeckCard,
  AddCardToDeckInput,
  UpdateDeckCardInput,
  DeckType
} from '../../types/deck';
import { DeckCardRepository } from './DeckRepository';

const DECK_CARDS_TABLE = 'deck_cards';

export class SupabaseDeckCardRepository implements DeckCardRepository {
  private client: SupabaseClientWrapper;

  constructor(client: SupabaseClientWrapper) {
    this.client = client;
  }

  async addCardToDeck(input: AddCardToDeckInput): Promise<DeckCard | null> {
    // Add card to deck
    const from = this.client.from(DECK_CARDS_TABLE);
    const cardDetailsSelect = `
      *,
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
    `;
    const { data: deckCard, error } = await from
      .insert(input)
      .select(cardDetailsSelect)
      .single();

    if (error) {
      console.error('Error adding card to deck:', error);
      return null;
    }

    return deckCard;
  }

  async removeCardFromDeck(deckId: string, cardId: string): Promise<boolean> {
    const from = this.client.from(DECK_CARDS_TABLE);
    const { error } = await from
      .delete()
      .eq('deck_id', deckId)
      .eq('card_id', cardId);

    if (error) {
      console.error('Error removing card from deck:', error);
      return false;
    }

    return true;
  }

  async updateDeckCard(deckId: string, cardId: string, input: UpdateDeckCardInput): Promise<DeckCard | null> {
    // Deck size limit validation moved to service layer
    const from = this.client.from(DECK_CARDS_TABLE);
    const cardDetailsSelect = `
      *,
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
    `;
    const { data: deckCard, error } = await from
      .update(input)
      .eq('deck_id', deckId)
      .eq('card_id', cardId)
      .select(cardDetailsSelect)
      .single();

    if (error) {
      console.error('Error updating deck card:', error);
      return null;
    }

    return deckCard;
  }

  async reorderDeckCards(deckId: string, _deckType: DeckType, cardIds: string[]): Promise<boolean> {
    const from = this.client.from(DECK_CARDS_TABLE);
    // Update positions for all cards in the specified deck type
    const updates = cardIds.map((cardId, index) => ({
      deck_id: deckId,
      card_id: cardId,
      position: index
    }));

    const { error } = await from
      .upsert(updates);

    if (error) {
      console.error('Error reordering deck cards:', error);
      return false;
    }

    return true;
  }
}
