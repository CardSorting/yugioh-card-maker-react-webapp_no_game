import { Container, Row, Col } from 'react-bootstrap';
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import './Auth.css';

export default function Auth() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (session) {
    return <Navigate to="/create" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/create"
          }
        }).catch(err => {
          if (err.message?.includes('fetch')) {
            throw new Error('Unable to connect to authentication service. Please check your internet connection and try again.');
          }
          throw err;
        });
        
        if (error) {
          if (error.message.includes('network')) {
            throw new Error('Network error. Please check your connection and try again.');
          } else if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password.');
          } else if (error.message.includes('Email not confirmed')) {
            throw new Error('Please verify your email address before signing in.');
          }
          throw error;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        }).catch(err => {
          if (err.message?.includes('fetch')) {
            throw new Error('Unable to connect to authentication service. Please check your internet connection and try again.');
          }
          throw err;
        });
        
        if (error) {
          if (error.message.includes('network')) {
            throw new Error('Network error. Please check your connection and try again.');
          } else if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password.');
          } else if (error.message.includes('Email not confirmed')) {
            throw new Error('Please verify your email address before signing in.');
          }
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="mt-5 mb-3 h-100 py-3 py-md-5 px-0 px-sm-5">
      <Row className="h-100 justify-content-center align-content-center">
        <Col id="auth-panel" xs={12} md={6} lg={4}>
          <div className="panel-bg shadow p-3">
            <h2 className="text-white text-center mb-4">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label text-white">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="form-label text-white">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              {error && (
                <div className="alert alert-danger mb-3" role="alert">
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="btn btn-primary w-100 mb-3"
                disabled={loading}
              >
                {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  className="btn btn-link text-white"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
