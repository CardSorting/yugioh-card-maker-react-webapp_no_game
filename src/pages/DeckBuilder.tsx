import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DeckEditor } from '../components/deck/DeckEditor';
import { DBCard } from '../types/card';
import { DeckService } from '../services/deck/deckService';
import { useAuth } from '../context/AuthContext';

export const DeckBuilder = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userCards, setUserCards] = useState<DBCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deckId) {
      navigate('/decks');
      return;
    }

  const loadData = async () => {
    try {
      console.log('Loading deck builder data for deck:', deckId);
      
      if (!user?.id) {
        console.error('No user session found');
        setError('No user session found');
        return;
      }

      // Verify deck ownership
      const deck = await DeckService.getDeckDetails(deckId);
      console.log('Fetched deck details:', deck);

      if (!deck || deck.user_id !== user.id) {
        console.error('Deck access error:', {
          deckId,
          found: !!deck,
          deckUserId: deck?.user_id,
          userId: user.id
        });
        setError('deck_not_found');
        return;
      }

      // Load user's cards
      console.log('Fetching cards for user:', user.id);
      const cards = await DeckService.getDeckCards(user.id);

      if (!cards || cards.length === 0) {
        console.log('No cards found for user. Please create some cards first.');
        setError('no_cards');
        setUserCards([]);
        return;
      }

      console.log('Fetched user cards:', cards.length);
      setUserCards(cards);
    } catch (err) {
      console.error('Error loading deck builder data:', err);
      setError('Failed to load deck builder data');
    } finally {
      setLoading(false);
    }
  };

    loadData();
  }, [deckId, user?.id]);

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
      <DeckEditor deckId={deckId} userCards={userCards} />
    </div>
  );
};

export default DeckBuilder;
