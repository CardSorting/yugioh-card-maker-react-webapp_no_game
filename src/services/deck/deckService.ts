import { supabase } from '../../supabaseClient';
import {
  Deck,
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

const DECK_TABLE = 'decks';
const DECK_CARDS_TABLE = 'deck_cards';
const DECK_DETAILS_VIEW = 'deck_details';

export const createDeck = async (input: CreateDeckInput): Promise<DeckDetails | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    console.error('No authenticated user');
    return null;
  }

  const { data: deck, error } = await supabase
    .from(DECK_TABLE)
    .insert({ 
      name: input.name,
      user_id: session.user.id
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating deck:', error);
    return null;
  }

  // Get deck details from materialized view
  const { data: deckDetails, error: detailsError } = await supabase
    .from(DECK_DETAILS_VIEW)
    .select()
    .eq('id', deck.id)
    .eq('user_id', session.user.id)
    .single();

  if (detailsError) {
    console.error('Error fetching deck details:', detailsError);
    return null;
  }

  return deckDetails;
};

export const updateDeck = async (id: string, input: UpdateDeckInput): Promise<DeckDetails | null> => {
  const { error } = await supabase
    .from(DECK_TABLE)
    .update(input)
    .eq('id', id);

  if (error) {
    console.error('Error updating deck:', error);
    return null;
  }

  // Get updated deck details
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    console.error('No authenticated user');
    return null;
  }

  const { data: deckDetails, error: detailsError } = await supabase
    .from(DECK_DETAILS_VIEW)
    .select()
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (detailsError) {
    console.error('Error fetching updated deck details:', detailsError);
    return null;
  }

  return deckDetails;
};

export const deleteDeck = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from(DECK_TABLE)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting deck:', error);
    return false;
  }

  return true;
};

export const getDeckDetails = async (id: string): Promise<DeckWithCards | null> => {
  // Get session first
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    console.error('No authenticated user');
    return null;
  }

  // Get deck details from materialized view
  const { data: deckDetails, error: detailsError } = await supabase
    .from(DECK_DETAILS_VIEW)
    .select()
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (detailsError) {
    console.error('Error fetching deck details:', detailsError, {
      deckId: id,
      userId: session.user.id
    });
    return null;
  }

  if (!deckDetails) {
    console.error('No deck found or unauthorized access:', {
      deckId: id,
      userId: session.user.id
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
  const { data: deckCards, error: cardsError } = await supabase
    .from(DECK_CARDS_TABLE)
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
        cardRED:pendulum_red,
        pendulumSize:pendulum_size,
        cardPendulumInfo:pendulum_info,
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
    .order('position', { ascending: true }) as { 
      data: DeckCardResponse[] | null; 
      error: any; 
    };

  console.log('Fetched deck cards:', {
    total: deckCards?.length || 0,
    error: cardsError?.message,
    deckId: id,
    userId: session.user.id,
    cards: deckCards?.map(dc => ({
      id: dc.card?.id || '',
      title: dc.card?.cardTitle || '',
      type: dc.card?.cardType || '',
      deckType: dc.deck_type
    })) || []
  });

  if (cardsError) {
    console.error('Error fetching deck cards:', cardsError);
    return null;
  }

  // Organize cards by deck type
  const mainDeck = (deckCards || [])
    .filter(card => card.deck_type === 'main' && card.card !== null)
    .map(card => ({
      id: card.id,
      deck_id: card.deck_id,
      card_id: card.card_id,
      deck_type: card.deck_type,
      position: card.position,
      created_at: card.created_at,
      card: card.card
    } as DeckCard));

  const extraDeck = (deckCards || [])
    .filter(card => card.deck_type === 'extra' && card.card !== null)
    .map(card => ({
      id: card.id,
      deck_id: card.deck_id,
      card_id: card.card_id,
      deck_type: card.deck_type,
      position: card.position,
      created_at: card.created_at,
      card: card.card
    } as DeckCard));

  const sideDeck = (deckCards || [])
    .filter(card => card.deck_type === 'side' && card.card !== null)
    .map(card => ({
      id: card.id,
      deck_id: card.deck_id,
      card_id: card.card_id,
      deck_type: card.deck_type,
      position: card.position,
      created_at: card.created_at,
      card: card.card
    } as DeckCard));

  return {
    ...deckDetails,
    main_deck: mainDeck,
    extra_deck: extraDeck,
    side_deck: sideDeck
  };
};

export const getUserDecks = async (params?: GetDecksParams): Promise<DeckDetails[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    console.error('No authenticated user');
    return [];
  }

  let query = supabase
    .from('deck_details')
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

  console.log('Fetched decks:', {
    total: decks?.length || 0,
    params,
    userId: session.user.id,
    decks: decks?.map(d => ({
      id: d.id,
      name: d.name,
      public: d.public,
      bookmarkCount: d.bookmark_count,
      mainCount: d.main_deck_count,
      extraCount: d.extra_deck_count,
      sideCount: d.side_deck_count
    })) || []
  });

  return decks || [];
};

export const toggleDeckPublic = async (deckId: string): Promise<boolean> => {
  const { data: deck, error: getError } = await supabase
    .from('decks')
    .select('public')
    .eq('id', deckId)
    .single();

  if (getError) {
    console.error('Error fetching deck:', getError);
    return false;
  }

  const { error: updateError } = await supabase
    .from('decks')
    .update({ public: !deck.public })
    .eq('id', deckId);

  if (updateError) {
    console.error('Error updating deck public status:', updateError);
    return false;
  }

  return true;
};

export const toggleDeckBookmark = async (deckId: string): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    console.error('No authenticated user');
    return false;
  }

  const { data: bookmark } = await supabase
    .from('deck_bookmarks')
    .select('id')
    .eq('deck_id', deckId)
    .eq('user_id', session.user.id)
    .single();

  if (bookmark) {
    // Remove bookmark
    const { error } = await supabase
      .from('deck_bookmarks')
      .delete()
      .eq('deck_id', deckId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error removing bookmark:', error);
      return false;
    }
  } else {
    // Add bookmark
    const { error } = await supabase
      .from('deck_bookmarks')
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
};

export const addCardToDeck = async (input: AddCardToDeckInput): Promise<DeckCard | null> => {
  // Get session and validate deck size limits
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    console.error('No authenticated user');
    return null;
  }

  const { data: deckDetails, error: detailsError } = await supabase
    .from(DECK_DETAILS_VIEW)
    .select()
    .eq('id', input.deck_id)
    .eq('user_id', session.user.id)
    .single();

  if (detailsError) {
    console.error('Error fetching deck details:', detailsError);
    return null;
  }

  // Check deck size limits
  if (
    (input.deck_type === 'main' && deckDetails.main_deck_count >= 60) ||
    (input.deck_type === 'extra' && deckDetails.extra_deck_count >= 15) ||
    (input.deck_type === 'side' && deckDetails.side_deck_count >= 15)
  ) {
    console.error(`${input.deck_type} deck is at maximum capacity`);
    return null;
  }

  // Add card to deck
  const { data: deckCard, error } = await supabase
    .from(DECK_CARDS_TABLE)
    .insert(input)
    .select(`
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
        cardRED:pendulum_red,
        pendulumSize:pendulum_size,
        cardPendulumInfo:pendulum_info,
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
    .single();

  console.log('Added card to deck:', {
    success: !!deckCard,
    error: error ? {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    } : null,
    input,
    cardDetails: deckCard?.card ? {
      id: deckCard.card.id,
      title: deckCard.card.cardTitle,
      type: deckCard.card.cardType,
      image: deckCard.card.card_image_path
    } : null,
    rawResponse: deckCard
  });

  if (error) {
    console.error('Error adding card to deck:', error);
    return null;
  }

  return deckCard;
};

export const removeCardFromDeck = async (deckId: string, cardId: string): Promise<boolean> => {
  const { error } = await supabase
    .from(DECK_CARDS_TABLE)
    .delete()
    .eq('deck_id', deckId)
    .eq('card_id', cardId);

  if (error) {
    console.error('Error removing card from deck:', error);
    return false;
  }

  return true;
};

export const updateDeckCard = async (
  deckId: string,
  cardId: string,
  input: UpdateDeckCardInput
): Promise<DeckCard | null> => {
  // If changing deck type, validate deck size limits
  if (input.deck_type) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    console.error('No authenticated user');
    return null;
  }

  const { data: deckDetails, error: detailsError } = await supabase
    .from(DECK_DETAILS_VIEW)
    .select()
    .eq('id', deckId)
    .eq('user_id', session.user.id)
    .single();

    if (detailsError) {
      console.error('Error fetching deck details:', detailsError);
      return null;
    }

    // Check deck size limits
    if (
      (input.deck_type === 'main' && deckDetails.main_deck_count >= 60) ||
      (input.deck_type === 'extra' && deckDetails.extra_deck_count >= 15) ||
      (input.deck_type === 'side' && deckDetails.side_deck_count >= 15)
    ) {
      console.error(`${input.deck_type} deck is at maximum capacity`);
      return null;
    }
  }

  const { data: deckCard, error } = await supabase
    .from(DECK_CARDS_TABLE)
    .update(input)
    .eq('deck_id', deckId)
    .eq('card_id', cardId)
    .select(`
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
        cardRED:pendulum_red,
        pendulumSize:pendulum_size,
        cardPendulumInfo:pendulum_info,
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
    .single();

  console.log('Updated deck card:', {
    success: !!deckCard,
    error: error ? {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    } : null,
    input,
    cardDetails: deckCard?.card ? {
      id: deckCard.card.id,
      title: deckCard.card.cardTitle,
      type: deckCard.card.cardType,
      image: deckCard.card.card_image_path
    } : null,
    rawResponse: deckCard
  });

  if (error) {
    console.error('Error updating deck card:', error);
    return null;
  }

  return deckCard;
};

export const reorderDeckCards = async (
  deckId: string,
  deckType: DeckType,
  cardIds: string[]
): Promise<boolean> => {
  // Update positions for all cards in the specified deck type
  const updates = cardIds.map((cardId, index) => ({
    deck_id: deckId,
    card_id: cardId,
    position: index
  }));

  const { error } = await supabase
    .from(DECK_CARDS_TABLE)
    .upsert(updates);

  if (error) {
    console.error('Error reordering deck cards:', error);
    return false;
  }

  return true;
};
