# Star Seekers Gaming Platform

## Project Overview
This is a comprehensive full-stack JavaScript application featuring 6 games with an in-memory leaderboard system. The project uses React with TypeScript for the frontend, Express.js for the backend, and in-memory storage for session data.

## Architecture

### Storage System
The application uses PostgreSQL database with the following data structures:

1. **users** - User accounts and profiles with authentication and direct registration
2. **Individual Game Leaderboards** - Separate tables for each game:
   - **game1_leaderboard** - Asteroid Blaster leaderboard
   - **game2_leaderboard** - Space Snake leaderboard
   - **game3_leaderboard** - Star Wars leaderboard
   - **game4_leaderboard** - Cosmic Defense leaderboard
   - **game5_leaderboard** - Galaxy Runner leaderboard
   - **game6_leaderboard** - Nebula Navigator leaderboard
3. **global_leaderboards** - Overall rankings that persist permanently

### Leaderboard Structure
- **6 Individual Game Leaderboards** (1 per game)
  - Monthly leaderboards (reset every month)
  - Yearly leaderboards (reset every year)
- **1 Global Leaderboard** (combines all points during session)

Total: 13 leaderboards (6 games × 2 periods + 1 global)

### Games Implemented
1. **Cosmic Battle Arena** (Space Shooter) - `/game1`
2. **Stellar Mining** (Snake) - `/game2`  
3. **Space Traders** (Memory Cards) - `/game3`
4. **Lore Master** (Quiz) - `/game4`
5. **Star Seekers Puzzle** (Sliding Puzzle) - `/game5`
6. **Cargo Runner** (Maze/Pac-man style) - `/game6`

## API Endpoints

### Leaderboard APIs
- `POST /api/games/score` - Record game score to individual leaderboard
- `GET /api/leaderboard/global` - Get global leaderboard
- `GET /api/leaderboard/game/:gameId?type=monthly|yearly` - Get game-specific leaderboard
- `GET /api/leaderboard/position` - Get user's current position
- Removed: `/api/user/sessions` - Game session tracking removed
- `GET /api/games/config` - Get games configuration

### User APIs
- `POST /api/register` - Direct user registration with immediate account creation
- `POST /api/login` - User login
- `GET /api/user` - Get current user
- `PUT /api/user/profile` - Update user profile

## Key Features

### Leaderboard System Features
- **Automatic Period Management**: Monthly/yearly periods are automatically calculated and managed
- **Real-time Updates**: Leaderboards update immediately when games are completed
- **Multiple Ranking Types**: Score-based for individual games, points-based for global
- **User Position Tracking**: Users can see their current rank in any leaderboard
- **Faction Statistics**: Aggregate statistics by user faction (oni, mud, ustur)

### Reset Logic
- **Monthly Leaderboards**: Reset on the 1st of each month
- **Yearly Leaderboards**: Reset on January 1st  
- **Global Leaderboard**: Never resets (permanent hall of fame)

## Usage for Games

Games should use the utility functions in `client/src/utils/gameLeaderboard.ts`:

```typescript
import { recordGameSession } from '@/utils/gameLeaderboard';

// When a game ends
await recordGameSession({
  gameId: 1,           // 1-6 for each game
  score: finalScore,   // Player's score in this session
  points: earnedPoints,// Points earned (can be calculated)
  duration: playTime   // Optional: game duration in seconds
});
```

## Data Management

### PostgreSQL Database
All data is persistently stored in a PostgreSQL database using Neon serverless. Data remains available between server restarts and deployments.

### Default Users
- TestUser (id: 1) - 150 points, oni faction
- PG (id: 2) - 250 points, mud faction

## User Preferences
- Language: Simple, everyday language for non-technical users
- Focus: Complete, working solutions over quick implementations
- Communication: Calm, supportive tone without excessive technical details

## Recent Changes

### 2025-08-13: PostgreSQL Database Fully Operational
- **Database Integration Complete**: Successfully integrated PostgreSQL database using Neon serverless
- **All Tables Created**: Users, global_leaderboards, and individual game leaderboard tables (game1-game6)
- **Storage Layer Active**: DatabaseStorage class properly implemented and tested
- **API Endpoints Verified**: All leaderboard and user management APIs working with live database
- **Data Persistence Confirmed**: User registration, game scores, and rankings now permanently stored
- **TypeScript Issues Resolved**: Fixed schema type definitions for better compatibility
- **Test Data Validated**: Created test users and leaderboard entries, confirmed proper data retrieval
- **Environment Setup**: DATABASE_URL and PostgreSQL environment variables properly configured

### 2025-08-11: PostgreSQL Database Integration & Individual Game Leaderboards
- **Database Addition**: Successfully integrated PostgreSQL database using Neon serverless
- **Schema Migration**: Created comprehensive Drizzle ORM schemas for all data structures
- **Database Tables Created**: Users, global_leaderboards, game_sessions, user_registrations, individual game leaderboards
- **Individual Game Leaderboards**: Created separate tables for each of the 6 games (game1_leaderboard through game6_leaderboard)
- **Game-Specific Storage**: Each game now has its own dedicated leaderboard table with proper indexing for performance
- **User Registration System**: Created user registration table and API endpoints for managing user sign-ups
- **Registration Fields**: Username, email, faction, and Solana wallet address with pending/approved/rejected status
- **Storage Implementation**: Replaced in-memory storage with DatabaseStorage class using Drizzle queries
- **API Enhancements**: Added individual game leaderboard support with ?individual=true parameter
- **Legacy Code Cleanup**: Removed obsolete game_leaderboards table and all related references from codebase
- **Code Refactoring**: Cleaned up imports, types, and methods that referenced the old combined leaderboard system
- **User System Simplification**: Removed user_registrations table and approval workflow, simplified to direct user registration
- **Registration Streamlining**: Consolidated to single /api/register endpoint for immediate account creation
- **Game Session Removal**: Removed game_sessions table and all session tracking functionality
- **Code Cleanup**: Removed session-related API endpoints and storage methods
- **API Endpoints Added**: POST /api/user/register, GET /api/admin/registrations, PUT /api/admin/registrations/:id/status
- **Environment Setup**: Configured DATABASE_URL and other PostgreSQL environment variables
- **Data Persistence**: All user data, game sessions, leaderboards, and registrations now persist in database
- **Test Data Migration**: Successfully migrated test users (TestUser, PG) to database
- **Dependencies Added**: Installed @neondatabase/serverless, drizzle-orm, drizzle-kit, drizzle-zod
- **Performance Optimization**: Added proper indexes on user_id, score, and period fields for all game leaderboard tables
- **API Testing**: Successfully tested individual game leaderboards with sample data for all 6 games
- **Database Verification**: Confirmed old game_leaderboards table removed and individual tables working correctly

### Previous: Database Removal & In-Memory Storage Migration (Reversed)
- Previous in-memory implementation has been completely replaced with PostgreSQL database
- All storage operations now use authentic database queries instead of memory-based data

### Previous: Application Debugging & Video Intro Enhancement
- **Fixed Application Startup Issues**: Resolved LSP errors in server routes and CreditsContext
- **Enhanced Video Intro**: Set video duration to exactly 1 minute 18 seconds with automatic redirect
- **Auto-Navigation Logic**: Video automatically closes and redirects based on authentication status
- **Updated Starting Credits**: Changed default credits for new users from 100 to 10
- **Leaderboard System**: Implemented monthly/yearly leaderboards with global Hall of Fame
- **Point Breakdown Feature**: Added API endpoint for detailed user game breakdown
- **Game Integration Utilities**: Created utility functions for easy game integration

### Frontend Features
- Tabbed interface: Global Hall of Fame vs Game Leaderboards
- Game selector for viewing specific game rankings
- Monthly/Yearly toggle for each game
- Top 3 podium display for champions
- User highlighting (current user gets special styling)
- Faction statistics dashboard
- Real-time loading states and error handling

## Project Structure
```
client/src/
  pages/Leaderboard.tsx     - Main leaderboard interface
  utils/gameLeaderboard.ts  - Game integration utilities
  
server/
  storage.ts               - In-memory storage operations
  routes.ts               - API endpoints and validation schemas
```