import { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

interface SavedCard {
  id: string;
  card_title: string;
  card_type: string;
  card_image_path: string;
  created_at: string;
}

const Collection = () => {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center mt-5">Loading cards...</div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">My Card Collection</h2>
      <Row xs={1} md={2} lg={3} xl={4} className="g-4">
        {cards.map((card) => (
          <Col key={card.id}>
            <Card className="h-100 shadow-sm">
              <Card.Img
                variant="top"
                src={card.card_image_path}
                alt={card.card_title}
                style={{ objectFit: 'contain', height: '300px' }}
              />
              <Card.Body>
                <Card.Title>{card.card_title}</Card.Title>
                <Card.Text>
                  Type: {card.card_type}
                </Card.Text>
                <Card.Text>
                  <small className="text-muted">
                    Created: {new Date(card.created_at).toLocaleDateString()}
                  </small>
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
        {cards.length === 0 && (
          <Col xs={12}>
            <div className="text-center mt-5">
              <p>No cards in your collection yet. Start creating some cards!</p>
            </div>
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default Collection;
