# Yu-Gi-Oh Card Maker

A web application for creating and sharing custom Yu-Gi-Oh cards.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd yugioh-card-maker-react-webapp_no_game
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```env
# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database Configuration
PGUSER=postgres
PGHOST=localhost
PGPASSWORD=<your-postgres-password>
PGDATABASE=yugioh_card_maker
PGPORT=5432

# JWT Configuration
JWT_SECRET=<your-secret-key>
JWT_EXPIRES_IN=24h

# File Storage
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

4. Initialize the database:
```bash
npm run db:setup
```
This will:
- Create the database if it doesn't exist
- Set up all required tables
- Create a test user (in development mode)
  - Email: test@example.com
  - Password: password123

## Development

1. Start the development server:
```bash
npm run dev:full
```
This will start both:
- Vite development server for the frontend (default: http://localhost:5173)
- Express API server (default: http://localhost:3000)

2. Individual commands:
- Frontend only: `npm run dev`
- Backend only: `npm run dev:server`
- Build: `npm run build`
- Start production server: `npm start`

## Project Structure

```
├── src/
│   ├── client.ts              # API client configuration
│   ├── components/            # React components
│   ├── context/              # React context providers
│   ├── routes/               # Express route handlers
│   ├── services/             # Business logic and database operations
│   ├── middleware/           # Express middleware
│   ├── config/               # Configuration files
│   ├── db/                   # Database scripts and migrations
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── scripts/                  # Setup and maintenance scripts
├── public/                  # Static files
└── uploads/                 # User uploaded files
```

## Features

- User authentication (JWT)
- Card creation and management
- Deck building
- Social features (follows, likes, comments)
- Profile management
- Image upload and storage

## API Routes

### Auth
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- GET /api/auth/me - Get current user

### Profiles
- GET /api/profiles/:username - Get profile by username
- PUT /api/profiles - Update profile (auth required)
- GET /api/profiles/:username/stats - Get profile stats
- GET /api/profiles/:username/followers - Get followers
- GET /api/profiles/:username/following - Get following
- POST /api/profiles/follow/:username - Follow user (auth required)
- DELETE /api/profiles/follow/:username - Unfollow user (auth required)

### Cards (to be implemented)
- POST /api/cards - Create card
- PUT /api/cards/:id - Update card
- DELETE /api/cards/:id - Delete card
- GET /api/cards/:id - Get card
- GET /api/cards - List cards

### Decks (to be implemented)
- POST /api/decks - Create deck
- PUT /api/decks/:id - Update deck
- DELETE /api/decks/:id - Delete deck
- GET /api/decks/:id - Get deck
- GET /api/decks - List decks

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests (when implemented)
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details
