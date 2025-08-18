import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { storage } from './storage';

// Configure Discord OAuth Strategy
passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID || '',
  clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
  callbackURL: process.env.DISCORD_CALLBACK_URL || '/api/auth/discord/callback',
  scope: ['identify', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Discord OAuth callback - Profile:', {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      avatar: profile.avatar
    });

    // Check if user already exists by Discord ID
    let user = await storage.getUserByDiscordId(profile.id);
    
    if (user) {
      // Update existing user's Discord info
      user = await storage.updateUser(user.id, {
        discordUsername: profile.username,
        discordAvatar: profile.avatar,
        email: profile.email || user.email, // Update email if provided
      });
      console.log('Updated existing Discord user:', user.id);
      return done(null, user);
    }

    // Check if user exists by email (for migration from old accounts)
    if (profile.email) {
      user = await storage.getUserByEmail(profile.email);
      if (user && !user.discordId) {
        // Link existing account to Discord
        user = await storage.updateUser(user.id, {
          discordId: profile.id,
          discordUsername: profile.username,
          discordAvatar: profile.avatar,
        });
        console.log('Linked existing account to Discord:', user.id);
        return done(null, user);
      }
    }

    // Create new user from Discord profile
    const newUser = await storage.createUser({
      username: profile.username,
      email: profile.email || `${profile.username}@discord.user`,
      discordId: profile.id,
      discordUsername: profile.username,
      discordAvatar: profile.avatar,
    });

    console.log('Created new Discord user:', newUser.id);
    return done(null, newUser);
    
  } catch (error) {
    console.error('Discord OAuth error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;