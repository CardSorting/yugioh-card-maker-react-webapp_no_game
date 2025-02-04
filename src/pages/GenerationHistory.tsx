import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

interface Generation {
  id: string;
  prompt: string;
  image_url: string;
  created_at: string;
  is_used: boolean;
}

const GenerationHistory = () => {
  const navigate = useNavigate();
  useAuth(); // Ensure user is authenticated
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGenerations = async () => {
      try {
        const { data, error } = await supabase
          .from('user_generations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setGenerations(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch generations');
      } finally {
        setLoading(false);
      }
    };

    fetchGenerations();
  }, []);

  const handleUseImage = (imageUrl: string) => {
    navigate('/create', { 
      state: { 
        generatedImageUrl: imageUrl 
      }
    });
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-5 mb-3 h-100 py-3 py-md-5 px-0 px-sm-5">
      <Row className="justify-content-center">
        <Col xs={12} md={10} lg={8}>
          <div className="panel-bg shadow p-3">
            <h2 className="text-center mb-4">Your Generated Images</h2>
            
            {generations.length === 0 ? (
              <div className="text-center text-muted">
                <p>No generated images yet.</p>
                <Button variant="primary" onClick={() => navigate('/generate-image')}>
                  Generate Your First Image
                </Button>
              </div>
            ) : (
              <Row xs={1} md={2} lg={3} className="g-4">
                {generations.map((gen) => (
                  <Col key={gen.id}>
                    <Card className="h-100">
                      <Card.Img
                        variant="top"
                        src={gen.image_url}
                        alt="Generated card art"
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      <Card.Body>
                        <Card.Text className="text-muted small mb-2">
                          {new Date(gen.created_at).toLocaleDateString()}
                        </Card.Text>
                        <Card.Text className="small" style={{ 
                          maxHeight: '60px', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }}>
                          {gen.prompt}
                        </Card.Text>
                        <div className="d-grid gap-2">
                          <Button
                            variant={gen.is_used ? "secondary" : "success"}
                            onClick={() => handleUseImage(gen.image_url)}
                            disabled={gen.is_used}
                          >
                            {gen.is_used ? 'Already Used' : 'Use in Card Maker'}
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default GenerationHistory;
