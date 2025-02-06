import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DeckEditor } from '../components/deck/DeckEditor';
import { useDeckActions } from '../hooks/deck/useDeckActions';
import { DBCard } from '../types/card';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export const DeckBuilder = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [userCards, setUserCards] = useState<DBCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deck, setDeck] = useState<any>(null);
  const { getDeckDetails } = useDeckActions();

  useEffect(() => {
    if (!deckId) {
      navigate('/decks');
      return;
    }

  const loadData = async () => {
    try {
      console.log('Loading deck builder data for deck:', deckId);
      console.log('Current session user:', session?.user?.id);
      
      if (!session?.user?.id) {
        console.error('No user session found');
        setError('No user session found');
        return;
      }

      // Get deck details
      const deckDetails = await getDeckDetails(deckId);
      console.log('Fetched deck details:', deckDetails);

      if (!deckDetails) {
        console.error('Deck not found:', { deckId });
        setError('deck_not_found');
        return;
      }

      // Check if user can edit the deck
      const canEdit = deckDetails.user_id === session?.user?.id;
      if (!canEdit && !deckDetails.public) {
        console.error('Cannot access private deck:', {
          deckId,
          deckUserId: deckDetails.user_id,
          sessionUserId: session?.user?.id,
          isPublic: deckDetails.public
        });
        setError('deck_not_found');
        return;
      }

      // Store deck details in state
      setDeck(deckDetails);

      // Load user's cards with detailed error logging
      console.log('Fetching cards for user:', session.user.id);
      const { data: cards, error: cardsError } = await supabase
        .from('cards')
        .select('id,user_id,created_at,card_image_path,ui_lang:ui_lang,card_lang:card_lang,holo,card_rare:card_rare,card_key:card_key,card_title:card_title,card_type:card_type,card_subtype:card_subtype,card_effect_1:card_effect_1,card_effect_2:card_effect_2,card_attribute:card_attribute,card_race:card_race,custom_race_enabled:custom_race_enabled,custom_race:custom_race,is_pendulum:is_pendulum,is_special:is_special,card_level:card_level,pendulum_blue:pendulum_blue,pendulum_red:pendulum_red,pendulum_info:pendulum_info,card_atk:card_atk,card_def:card_def,links,info_size:info_size,card_info:card_info,pendulum_size:pendulum_size')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (cardsError) {
        console.error('Error fetching user cards:', cardsError);
        console.error('Error details:', {
          message: cardsError.message,
          details: cardsError.details,
          hint: cardsError.hint
        });
        throw cardsError;
      }

      console.log('Cards fetch response:', {
        success: !!cards,
        count: cards?.length || 0,
        firstCard: cards?.[0] ? {
          id: cards[0].id,
          title: cards[0].card_title,
          type: cards[0].card_type,
          image: cards[0].card_image_path
        } : null,
        query: {
          userId: session.user.id,
          sql: `SELECT * FROM cards WHERE user_id = '${session.user.id}' ORDER BY created_at DESC`
        }
      });

      if (!cards || cards.length === 0) {
        console.log('No cards found for user. Please create some cards first.');
        setError('no_cards');
        setUserCards([]);
        return;
      }

      // Map database response to DBCard type
      const cardsWithSocial = (cards || []).map(card => ({
        id: card.id,
        user_id: card.user_id,
        created_at: card.created_at,
        card_image_path: card.card_image_path,
        uiLang: card.ui_lang,
        cardLang: card.card_lang,
        holo: card.holo,
        cardRare: card.card_rare,
        cardKey: card.card_key,
        cardTitle: card.card_title,
        cardType: card.card_type,
        cardSubtype: card.card_subtype,
        cardEff1: card.card_effect_1,
        cardEff2: card.card_effect_2,
        cardAttr: card.card_attribute,
        cardRace: card.card_race,
        cardCustomRaceEnabled: card.custom_race_enabled,
        cardCustomRace: card.custom_race,
        Pendulum: card.is_pendulum,
        Special: card.is_special,
        cardLevel: card.card_level,
        cardBLUE: card.pendulum_blue,
        cardRED: card.pendulum_red,
        cardPendulumInfo: card.pendulum_info,
        pendulumSize: card.pendulum_size || 0,
        cardATK: card.card_atk,
        cardDEF: card.card_def,
        links: card.links || {},
        infoSize: card.info_size,
        cardInfo: card.card_info,
        // Add default social features
        likes_count: 0,
        comments_count: 0,
        isLiked: false,
        isBookmarked: false,
        cardImg: null, // This is only used for card creation
        cardLoadYgoProEnabled: false // This is only used for card creation
      }));

      console.log('Fetched user cards:', cardsWithSocial.length);
      setUserCards(cardsWithSocial);
    } catch (err) {
      console.error('Error loading deck builder data:', err);
      setError('Failed to load deck builder data');
    } finally {
      setLoading(false);
    }
  };

    loadData();
  }, [deckId, session?.user?.id]);

  if (!deckId) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading deck builder...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">
          {error === 'no_cards' ? (
            <div className="text-center">
              <p className="text-xl font-semibold mb-2">No Cards Found</p>
              <p className="text-gray-600 mb-4">You need to create some cards before you can add them to your deck.</p>
              <div className="flex justify-center gap-4">
                <Link to="/create-card" className="btn btn-primary">
                  Create New Card
                </Link>
                <Link to="/decks" className="btn btn-secondary">
                  Back to Decks
                </Link>
              </div>
            </div>
          ) : error === 'deck_not_found' ? (
            <div className="text-center">
              <p className="text-xl font-semibold mb-2">Deck Not Found</p>
              <p className="text-gray-600 mb-4">This deck doesn't exist or you don't have permission to view it.</p>
              <div className="flex justify-center gap-4">
                <Link to="/decks" className="btn btn-primary">
                  View Your Decks
                </Link>
                <Link to="/create-card" className="btn btn-secondary">
                  Create New Card
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xl font-semibold text-red-500 mb-2">Error</p>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => window.location.reload()} className="btn btn-primary">
                  Try Again
                </button>
                <Link to="/decks" className="btn btn-secondary">
                  Back to Decks
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DeckEditor 
        deckId={deckId} 
        userCards={userCards} 
        readOnly={deck?.user_id !== session?.user?.id} 
      />
    </div>
  );
};

export default DeckBuilder;
