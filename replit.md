# Star Seekers Gaming Platform

## Overview
Star Seekers is a full-stack JavaScript gaming platform featuring six distinct games and a persistent, multi-tiered leaderboard system. The project's core purpose is to provide an engaging gaming experience with competitive elements, leveraging a React with TypeScript frontend and an Express.js backend. The platform aims to offer a robust and scalable solution for online gaming with a focus on user engagement through score-based competition and real-time ranking.

## User Preferences
- Language: Simple, everyday language for non-technical users
- Focus: Complete, working solutions over quick implementations
- Communication: Calm, supportive tone without excessive technical details

## System Architecture

### UI/UX Decisions
The frontend features a tabbed interface for navigation between global and game-specific leaderboards, a game selector, monthly/yearly toggles, a top 3 podium display, user highlighting, and a faction statistics dashboard. Real-time loading states and comprehensive error handling are integrated.

### Technical Implementations
The application utilizes a React frontend with TypeScript for type safety and maintainability. The backend is built with Express.js, providing a robust API layer. Persistent data storage is handled by a PostgreSQL database.

### Feature Specifications
- **Authentication System**: Email/password authentication for user registration and login.
- **Leaderboard System**:
    - **Individual Game Leaderboards**: Six separate leaderboards, one for each game, with monthly and yearly resets.
    - **Global Leaderboard**: A permanent, never-resetting leaderboard combining overall player points.
    - **Automatic Period Management**: Monthly and yearly periods are automatically calculated and managed.
    - **Real-time Updates**: Leaderboards update instantly upon game completion.
    - **Multiple Ranking Types**: Score-based for individual games, points-based for global.
    - **User Position Tracking**: Users can view their current rank across all leaderboards.
    - **Faction Statistics**: Aggregated statistics are available by user faction (oni, mud, ustur).
- **User Management**: Direct user registration and authentication, with profile updates.
- **Game Integration**: Games interact with the leaderboard system via a utility function (`recordGameSession`) to submit scores and points.
- **Credit System**: Integration with Stripe for payment processing to purchase in-game credits, featuring different credit packages.

### System Design Choices
- **Storage System**: All persistent data, including user accounts, profiles, and all leaderboard data (individual game, monthly, yearly, and global), is stored in a PostgreSQL database. This ensures data persistence across server restarts and deployments.
- **API Endpoints**: A structured API provides endpoints for:
    - Recording game scores (`POST /api/games/score`)
    - Retrieving global and game-specific leaderboards (`GET /api/leaderboard/global`, `GET /api/leaderboard/game/:gameId`)
    - Getting a user's leaderboard position (`GET /api/leaderboard/position`)
    - User authentication and profile management (`POST /api/register`, `POST /api/login`, `GET /api/user`, `PUT /api/user/profile`)
    - Retrieving game configuration (`GET /api/games/config`)
- **Build Process**: A custom `build.js` script is used for production builds to ensure the correct directory structure (`dist/public/` for static assets and `dist/index.js` for the server) for deployment.
  
## Deployment Configuration

### Build Process
The project uses a custom `build.js` script that properly structures files for deployment:

1. **Client Build**: Runs `vite build` to create optimized frontend assets in `client/dist/`
2. **Directory Structure**: Creates `dist/public/` directory for static files
3. **File Copy**: Copies all client build files from `client/dist/` to `dist/public/`
4. **Server Build**: Compiles server TypeScript to `dist/index.js` using esbuild

### Deployment Commands
- **Development**: `npm run dev` (starts development server)
- **Production Build**: `node build.js` (creates deployment-ready files)
- **Production Start**: `NODE_ENV=production node dist/index.js`

### Directory Structure After Build
```
dist/
├── public/          # Static files served by Express
│   ├── assets/      # Bundled CSS/JS files
│   ├── index.html   # Main HTML file
│   └── ...         # Other static assets
└── index.js        # Compiled server file
```

### Replit Deployment
The server expects static files at `dist/public/` and serves them using Express static middleware in production mode. The `build.js` script ensures this structure is correctly created for deployment.

## External Dependencies

- **PostgreSQL**: Used for all persistent data storage, including users, game-specific leaderboards, and the global leaderboard. Utilizes Neon serverless for database hosting.
- **Stripe**: Integrated for payment processing, specifically for handling in-game credit purchases using Payment Intents API and `price_data` for custom line items.
## Recent Changes (August 18, 2025)

### Authentication Simplification
- **Removed Discord OAuth**: Simplified authentication to use only email/password login for better user experience.
- **Streamlined Auth Flow**: Users now register and sign in using traditional email/password authentication.
- **Clean Authentication UI**: Removed Discord login buttons and OAuth integration from the authentication form.

### Deployment Configuration Fixes
- **Port Configuration**: Updated server to properly use PORT environment variable for deployment (port 80) while maintaining development compatibility (port 5000).
- **Environment Handling**: Improved production environment detection and configuration handling.
- **Production Readiness**: Server now properly configured for Replit deployment with correct port mapping.