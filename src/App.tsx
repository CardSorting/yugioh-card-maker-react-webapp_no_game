import { Container, Navbar } from 'react-bootstrap';
import { useAuth } from './context/AuthContext';
import { CardProvider } from './store/CardContext';
import { AuthProvider } from './context/AuthContext';
import LoadingDialog from './components/LoadingDialog';
import ProtectedRoute from './components/ProtectedRoute';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from "react-router-dom";
import { lazy, Suspense } from 'react';

const CreateCard = lazy(() => import('./pages/CreateCard'));
const Landing = lazy(() => import('./pages/Landing'));
const AuthPage = lazy(() => import('./pages/Auth'));
const GenerateImage = lazy(() => import('./pages/GenerateImage'));
const GenerationHistory = lazy(() => import('./pages/GenerationHistory'));
const Profile = lazy(() => import('./pages/Profile'));
const Feed = lazy(() => import('./pages/Feed'));
const CardDetail = lazy(() => import('./pages/CardDetail'));
const Decks = lazy(() => import('./pages/Decks'));
const DeckBuilder = lazy(() => import('./pages/DeckBuilder'));

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function NavContent() {
  const { session } = useAuth();
  return (
    <div className="text-center text-white">
      遊戲王卡片製造機<br/>yugioh card makers
      <div className="nav-links">
        <Link to="/create" className="nav-link">Create Card</Link>
        {session && (
          <>
            <Link to="/generate-image" className="nav-link">Generate Image</Link>
            <Link to="/generations" className="nav-link">My Generations</Link>
            <Link to="/decks" className="nav-link">My Decks</Link>
            <Link to="/feed" className="nav-link">Feed</Link>
            <Link to="/profile" className="nav-link">Profile</Link>
          </>
        )}
      </div>
    </div>
  );
}

function MainContent() {
  return (
    <div id="app">
      <header>
        <Navbar bg="dark" variant="dark" fixed="top">
          <Container className="justify-content-center">
            <NavContent />
          </Container>
        </Navbar>
      </header>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/create" element={<CreateCard />} />
          <Route
            path="/generate-image"
            element={
              <ProtectedRoute>
                <GenerateImage />
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/generations" element={<ProtectedRoute><GenerationHistory /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
          <Route path="/cards/:cardId" element={<ProtectedRoute><CardDetail /></ProtectedRoute>} />
          <Route path="/decks" element={<ProtectedRoute><Decks /></ProtectedRoute>} />
          <Route path="/decks/:deckId" element={<ProtectedRoute><DeckBuilder /></ProtectedRoute>} />
          <Route path="/" element={<Landing />} />
        </Routes>
      </Suspense>
      <LoadingDialog />
      </div>
  );
}

function AppContent() {
  return (
    <Router>
      <MainContent />
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <CardProvider>
        <AppContent />
      </CardProvider>
    </AuthProvider>
  );
}

export default App;
