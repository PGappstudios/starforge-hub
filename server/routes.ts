import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { stripe, CREDIT_PACKAGES, getPackageById, getTotalCredits, constructEvent } from "./stripe";

// Define validation schemas (moved from deleted schema.ts)
const insertUserSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6)
});

// Removed: insertUserRegistrationSchema - registration approval system removed

const updateUserProfileSchema = z.object({
  faction: z.enum(["oni", "mud", "ustur"]).optional(),
  email: z.string().email().optional().or(z.literal("")),
  solanaWallet: z.string().optional().or(z.literal("")),
  credits: z.number().int().min(0).optional(),
});

// Stripe payment validation schema - simplified for Price ID based payments
const createPaymentIntentSchema = z.object({
  packageId: z.string().min(1),
  currency: z.string().optional().default('usd'),
});

// Removed: insertGameSessionSchema - game session tracking removed

const GAMES_CONFIG = {
  1: { name: "Space Shooter" },
  2: { name: "Space Snake" },
  3: { name: "Memory Match" },
  4: { name: "Star Atlas Quiz" },
  5: { name: "Puzzle Master" },
  6: { name: "Resource Runner" }
} as const;

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Import express for raw body middleware
  const express = await import('express');
  
  // Stripe webhook needs raw body - add this middleware before express.json()
  app.use('/api/stripe/webhook', express.default.raw({ type: 'application/json' }));
  
  // Create in-memory session store
  const MemStore = MemoryStore(session);
  
  // Session configuration with in-memory store
  app.use(session({
    store: new MemStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || 'star-seekers-secret-key',
    resave: false,
    saveUninitialized: false,
    name: 'star-seekers-session',
    cookie: {
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: 'lax'
    }
  }));

  // Session debug endpoint (development only)
  if (process.env.NODE_ENV === 'development') {
    app.get("/api/session-debug", (req, res) => {
      res.json({
        sessionID: req.sessionID,
        userId: req.session.userId,
        session: req.session,
        headers: req.headers,
        cookies: req.headers.cookie
      });
    });
  }

  // Register route
  app.post("/api/register", async (req, res) => {
    try {
      const { username, email, password } = insertUserSchema.parse(req.body);

      // Check if email already exists
      const existingEmailUser = await storage.getUserByEmail(email);
      if (existingEmailUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
      });

      // Set session and save it explicitly
      req.session.userId = user.id;
      
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error during registration:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Login route
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session and save it explicitly
      req.session.userId = user.id;
      
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("Session save error during login:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/user", async (req, res) => {
    // Debug session information
    console.log("Session debug - ID:", req.sessionID, "UserID:", req.session.userId);
    
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get current calculated total points from global leaderboard
      const leaderboard = await storage.getGlobalLeaderboard(500); // Get enough entries to find user
      const leaderboardEntry = leaderboard.find(entry => entry.user.id === req.session.userId);
      
      // Update user's totalPoints with current calculated value
      const userWithCurrentPoints = {
        ...user,
        totalPoints: leaderboardEntry?.totalPoints || user.totalPoints || 0
      };

      // Return user without password
      const { password: _, ...userWithoutPassword } = userWithCurrentPoints;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update user profile
  app.put("/api/user/profile", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const profileData = updateUserProfileSchema.parse(req.body);
      const user = await storage.updateUserProfile(req.session.userId, profileData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Add credits
  app.post("/api/user/credits/add", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { amount } = req.body;
      if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const user = await storage.addUserCredits(req.session.userId, amount);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Add credits error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Spend credits
  app.post("/api/user/credits/spend", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { amount } = req.body;
      if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const user = await storage.spendUserCredits(req.session.userId, amount);
      if (!user) {
        return res.status(400).json({ message: "Insufficient credits or user not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Spend credits error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update user points and games played
  app.post("/api/user/game-result", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { points, gameId } = req.body;
      if (typeof points !== "number" || points < 0) {
        return res.status(400).json({ message: "Invalid points" });
      }

      const user = await storage.updateGameResult(req.session.userId, points);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update game result error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Record game score to individual leaderboard (replaces game session tracking)
  app.post("/api/games/score", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { gameId, score, points } = req.body;
      
      if (!gameId || score === undefined || points === undefined) {
        return res.status(400).json({ message: "Game ID, score, and points are required" });
      }

      if (gameId < 1 || gameId > 6) {
        return res.status(400).json({ message: "Invalid game ID. Must be between 1 and 6" });
      }

      // Record to individual game leaderboard
      await storage.addGameLeaderboardEntry(gameId, req.session.userId, score);
      
      // Update global leaderboard
      await storage.updateGlobalLeaderboard(req.session.userId, points);

      console.log(`Game score recorded: User ${req.session.userId}, Game ${gameId}, Score ${score}, Points ${points}`);
      
      res.json({ 
        success: true, 
        message: "Score recorded successfully",
        gameId,
        score,
        points
      });
    } catch (error) {
      console.error("Record game score error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get game leaderboard (public endpoint) - both old and new individual tables
  app.get("/api/leaderboard/game/:gameId", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const type = req.query.type as 'monthly' | 'yearly' || 'monthly';
      const limit = parseInt(req.query.limit as string) || 50;
      const useIndividual = req.query.individual === 'true';

      if (gameId < 1 || gameId > 6) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      let leaderboard;
      if (useIndividual) {
        // Use new individual game leaderboard tables
        leaderboard = await storage.getIndividualGameLeaderboard(gameId, type, limit);
      } else {
        // Use individual game leaderboard tables (default behavior)
        leaderboard = await storage.getIndividualGameLeaderboard(gameId, type, limit);
      }
      
      res.json(leaderboard || []); // Always return an array
    } catch (error) {
      console.error("Get game leaderboard error:", error);
      res.json([]); // Return empty array on error instead of 500
    }
  });

  // Get global leaderboard (public endpoint)
  app.get("/api/leaderboard/global", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const leaderboard = await storage.getGlobalLeaderboard(limit);
      res.json(leaderboard || []); // Always return an array
    } catch (error) {
      console.error("Get global leaderboard error:", error);
      res.json([]); // Return empty array on error instead of 500
    }
  });

  // Get legacy leaderboard (for backward compatibility)
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const users = await storage.getAllUsersForLeaderboard();
      res.json(users);
    } catch (error) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get user's leaderboard position
  app.get("/api/leaderboard/position", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const gameId = req.query.gameId ? parseInt(req.query.gameId as string) : undefined;
      const type = req.query.type as 'monthly' | 'yearly' | undefined;

      const position = await storage.getUserLeaderboardPosition(req.session.userId, gameId, type);
      res.json({ position });
    } catch (error) {
      console.error("Get user position error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Removed: Get user sessions endpoint - game session tracking removed

  // Get user's game breakdown (public endpoint for leaderboard details)
  app.get("/api/user/:userId/game-breakdown", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const breakdown = await storage.getUserGameBreakdown(userId);
      res.json(breakdown || []);
    } catch (error) {
      console.error("Get user game breakdown error:", error);
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Record game session
  app.post("/api/games/session", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { gameId, score, points, gameName } = req.body;
      
      console.log('Recording game session:', { userId: req.session.userId, gameId, score, points, gameName });
      
      if (typeof gameId !== "number" || gameId < 1 || gameId > 6) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      if (typeof score !== "number" || score < 0) {
        return res.status(400).json({ message: "Invalid score" });
      }

      if (typeof points !== "number" || points < 0) {
        return res.status(400).json({ message: "Invalid points" });
      }

      // Get user info for the leaderboard entry
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Add to individual game leaderboard
      const { start, end } = storage.getCurrentPeriod('monthly');
      
      const leaderboardEntry = {
        userId: req.session.userId,
        username: user.username,
        score,
        points,
        playedAt: new Date(),
        leaderboardType: 'monthly' as const,
        periodStart: start,
        periodEnd: end
      };

      await storage.addGameLeaderboardEntry(gameId, req.session.userId, score);
      
      // Update global leaderboard
      await storage.updateGlobalLeaderboard(req.session.userId, points);

      console.log('Game session recorded successfully for gameId:', gameId);
      res.json({ success: true, message: "Game session recorded successfully" });
    } catch (error) {
      console.error("Record game session error:", error);
      res.status(500).json({ message: "Server error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Reset user's game data (remove all game sessions and reset totals)
  app.delete("/api/user/:userId/reset-game-data", async (req, res) => {
    const targetUserId = parseInt(req.params.userId);
    
    // Only allow users to reset their own data or admin access
    if (!req.session.userId || req.session.userId !== targetUserId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    try {
      console.log(`Resetting game data for user ${targetUserId}`);
      
      // Reset all game data using the storage method
      await storage.resetUserGameData(targetUserId);
      
      console.log(`Successfully reset game data for user ${targetUserId}`);
      res.json({ 
        success: true, 
        message: "Game data reset successfully. All scores and progress have been cleared." 
      });
    } catch (error) {
      console.error("Reset game data error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get games configuration
  app.get("/api/games/config", (req, res) => {
    res.json(GAMES_CONFIG);
  });

  // Stripe API Routes

  // Get available credit packages
  app.get("/api/stripe/packages", (req, res) => {
    res.json(Object.values(CREDIT_PACKAGES));
  });

  // Create Stripe Checkout Session (following official documentation)
  app.post("/api/stripe/create-checkout-session", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { packageId } = req.body;
      
      // Validate package
      const pkg = getPackageById(packageId);
      if (!pkg) {
        return res.status(400).json({ message: "Invalid package ID" });
      }

      // Get user for customer creation
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price: pkg.stripePriceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/credits?canceled=true`,
        customer_email: user.email,
        metadata: {
          userId: req.session.userId.toString(),
          packageId: packageId,
          credits: (pkg.credits + pkg.bonus).toString(),
        },
      });

      console.log(`Created Stripe checkout session: ${session.id} for user ${req.session.userId}, package ${packageId}`);
      
      res.json({ url: session.url });
    } catch (error) {
      console.error("Create checkout session error:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Create payment intent with validation
  app.post("/api/stripe/create-payment-intent", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      // Validate input data
      const validatedData = createPaymentIntentSchema.parse(req.body);
      const { packageId, currency } = validatedData;
      
      // Validate package
      const pkg = getPackageById(packageId);
      if (!pkg) {
        return res.status(400).json({ message: "Invalid package ID" });
      }

      const expectedCredits = pkg.credits + pkg.bonus;

      // Rate limiting check (simple implementation)
      const rateLimitKey = `payment_attempts_${req.session.userId}`;
      // In production, you'd use Redis or similar for rate limiting

      // Get user for metadata
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // For test mode, simulate successful payment
      if (process.env.NODE_ENV === 'development') {
        console.log(`Creating test payment for user ${req.session.userId}, package ${packageId}, credits ${expectedCredits}`);
        
        // Create payment record
        const payment = await storage.createPayment({
          userId: req.session.userId,
          stripePaymentIntentId: `pi_test_${Date.now()}`,
          packageId,
          packageName: pkg.name,
          amount: pkg.price,
          credits: expectedCredits,
          currency
        });

        // Update payment status to succeeded for test mode
        await storage.updatePaymentStatus(payment.stripePaymentIntentId, 'succeeded');
        
        // Add credits immediately in test mode
        await storage.addUserCredits(req.session.userId, expectedCredits);
        
        console.log(`Test payment successful - added ${expectedCredits} credits to user ${req.session.userId}`);
        
        return res.json({
          success: true,
          clientSecret: 'test_client_secret',
          packageId,
          credits: expectedCredits,
          amount: Math.round(pkg.price * 100),
          testMode: true
        });
      }

      // Real Stripe payment using the imported stripe instance
      const { stripe } = await import('./stripe');
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(pkg.price * 100), // Convert to cents
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: req.session.userId.toString(),
          packageId,
          credits: expectedCredits.toString(),
          username: user.username,
          priceId: pkg.stripePriceId,
        },
        description: `StarForge Hub - ${pkg.name} (${expectedCredits} credits)`,
      });

      // Store payment record in database
      await storage.createPayment({
        userId: req.session.userId,
        stripePaymentIntentId: paymentIntent.id,
        packageId,
        packageName: pkg.name,
        amount: pkg.price,
        credits: expectedCredits,
        currency
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        packageId,
        credits: expectedCredits,
        amount: Math.round(pkg.price * 100),
        priceId: pkg.stripePriceId,
      });
    } catch (error: any) {
      console.error('Create payment intent error:', {
        message: error.message,
        stack: error.stack,
        userId: req.session.userId,
        packageId: req.body.packageId
      });
      
      // Handle validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: 'Invalid request data',
          errors: error.errors 
        });
      }
      
      // Handle Stripe errors
      if (error.type && error.type.startsWith('Stripe')) {
        return res.status(400).json({ 
          message: 'Payment processing error',
          error: error.message 
        });
      }
      
      res.status(500).json({ 
        message: 'Failed to create payment intent',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  // Stripe webhook handler
  app.post('/api/stripe/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      return res.status(400).json({ message: 'Missing stripe signature' });
    }

    try {
      // For development, skip webhook verification
      let event;
      if (process.env.NODE_ENV === 'development') {
        // In development, we may not have webhook secrets configured
        event = req.body;
      } else {
        event = constructEvent(req.body, sig);
      }
      
      console.log('Stripe webhook event:', event.type);
      
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          const { userId, packageId, credits } = session.metadata;
          
          if (userId && packageId && credits) {
            try {
              // Add credits to user account
              await storage.addUserCredits(parseInt(userId), parseInt(credits));
              
              console.log(`Credits added: User ${userId} received ${credits} credits for package ${packageId}`);
            } catch (error) {
              console.error('Error adding credits from webhook:', error);
            }
          }
          break;
        }
        
        case 'checkout.session.async_payment_succeeded': {
          const session = event.data.object as any;
          const { userId, packageId, credits } = session.metadata;
          
          if (userId && packageId && credits) {
            try {
              // Add credits to user account for async payments (like bank transfers)
              await storage.addUserCredits(parseInt(userId), parseInt(credits));
              
              console.log(`Credits added (async): User ${userId} received ${credits} credits for package ${packageId}`);
            } catch (error) {
              console.error('Error adding credits from async webhook:', error);
            }
          }
          break;
        }
        
        case 'checkout.session.async_payment_failed': {
          const session = event.data.object as any;
          const { userId, packageId } = session.metadata;
          
          console.log(`Payment failed for user ${userId}, package ${packageId}`);
          // Could implement retry logic or notification here
          break;
        }
        
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      
      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get payment history for user
  app.get("/api/stripe/payment-history", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get payment history from database
      const paymentHistory = await storage.getPaymentHistory(req.session.userId);
      res.json(paymentHistory);
    } catch (error: any) {
      console.error('Get payment history error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Removed: User registration approval routes - simplified to direct registration via /api/register

  // Removed: Admin registration management endpoint - approval system simplified

  // Removed: Admin registration status update endpoint - approval system simplified


  const httpServer = createServer(app);

  return httpServer;
}
