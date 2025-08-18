import { pgTable, serial, text, integer, timestamp, pgEnum, varchar, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const factionEnum = pgEnum('faction', ['oni', 'mud', 'ustur']);
export const leaderboardTypeEnum = pgEnum('leaderboard_type', ['monthly', 'yearly']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'succeeded', 'failed', 'refunded']);

// Users table - Discord OAuth integration
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }), // Optional for Discord users
  email: varchar('email', { length: 255 }).notNull(),
  discordId: varchar('discord_id', { length: 255 }).unique(), // Discord user ID
  discordUsername: varchar('discord_username', { length: 255 }), // Discord username
  discordAvatar: varchar('discord_avatar', { length: 255 }), // Discord avatar hash
  solanaWallet: varchar('solana_wallet', { length: 255 }),
  faction: factionEnum('faction'),
  totalPoints: integer('total_points').notNull().default(0),
  gamesPlayed: integer('games_played').notNull().default(0),
  achievements: integer('achievements').notNull().default(0),
  credits: integer('credits').notNull().default(10),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }), // Stripe customer ID
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Removed: gameLeaderboards table - replaced with individual game tables

// Global leaderboards table
export const globalLeaderboards = pgTable('global_leaderboards', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  totalPoints: integer('total_points').notNull(),
  rank: integer('rank').notNull(),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Removed: Game sessions table - session tracking not needed

// Removed: userRegistrations table - simplified to direct user creation

// Payment tracking table for Stripe transactions
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }).unique(),
  packageId: varchar('package_id', { length: 50 }).notNull(),
  packageName: varchar('package_name', { length: 255 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(), // Dollar amount
  credits: integer('credits').notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  currency: varchar('currency', { length: 3 }).notNull().default('usd'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Individual game leaderboard tables
export const game1Leaderboard = pgTable("game1_leaderboard", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  username: varchar("username", { length: 255 }).notNull(),
  score: integer("score").notNull(),
  points: integer("points").notNull(),
  playedAt: timestamp("played_at").defaultNow().notNull(),
  leaderboardType: leaderboardTypeEnum("leaderboard_type").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const game2Leaderboard = pgTable("game2_leaderboard", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  username: varchar("username", { length: 255 }).notNull(),
  score: integer("score").notNull(),
  points: integer("points").notNull(),
  playedAt: timestamp("played_at").defaultNow().notNull(),
  leaderboardType: leaderboardTypeEnum("leaderboard_type").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const game3Leaderboard = pgTable("game3_leaderboard", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  username: varchar("username", { length: 255 }).notNull(),
  score: integer("score").notNull(),
  points: integer("points").notNull(),
  playedAt: timestamp("played_at").defaultNow().notNull(),
  leaderboardType: leaderboardTypeEnum("leaderboard_type").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const game4Leaderboard = pgTable("game4_leaderboard", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  username: varchar("username", { length: 255 }).notNull(),
  score: integer("score").notNull(),
  points: integer("points").notNull(),
  playedAt: timestamp("played_at").defaultNow().notNull(),
  leaderboardType: leaderboardTypeEnum("leaderboard_type").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const game5Leaderboard = pgTable("game5_leaderboard", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  username: varchar("username", { length: 255 }).notNull(),
  score: integer("score").notNull(),
  points: integer("points").notNull(),
  playedAt: timestamp("played_at").defaultNow().notNull(),
  leaderboardType: leaderboardTypeEnum("leaderboard_type").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const game6Leaderboard = pgTable("game6_leaderboard", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  username: varchar("username", { length: 255 }).notNull(),
  score: integer("score").notNull(),
  points: integer("points").notNull(),
  playedAt: timestamp("played_at").defaultNow().notNull(),
  leaderboardType: leaderboardTypeEnum("leaderboard_type").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  globalLeaderboards: many(globalLeaderboards),
  game1Leaderboard: many(game1Leaderboard),
  game2Leaderboard: many(game2Leaderboard),
  game3Leaderboard: many(game3Leaderboard),
  game4Leaderboard: many(game4Leaderboard),
  game5Leaderboard: many(game5Leaderboard),
  game6Leaderboard: many(game6Leaderboard),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

// Removed: gameLeaderboardsRelations - replaced with individual game relations

export const globalLeaderboardsRelations = relations(globalLeaderboards, ({ one }) => ({
  user: one(users, {
    fields: [globalLeaderboards.userId],
    references: [users.id],
  }),
}));

// Removed: gameSessionsRelations - game sessions table removed

// Removed: userRegistrationsRelations - registration table removed

// Individual game leaderboard relations
export const game1LeaderboardRelations = relations(game1Leaderboard, ({ one }) => ({
  user: one(users, {
    fields: [game1Leaderboard.userId],
    references: [users.id],
  }),
}));

export const game2LeaderboardRelations = relations(game2Leaderboard, ({ one }) => ({
  user: one(users, {
    fields: [game2Leaderboard.userId],
    references: [users.id],
  }),
}));

export const game3LeaderboardRelations = relations(game3Leaderboard, ({ one }) => ({
  user: one(users, {
    fields: [game3Leaderboard.userId],
    references: [users.id],
  }),
}));

export const game4LeaderboardRelations = relations(game4Leaderboard, ({ one }) => ({
  user: one(users, {
    fields: [game4Leaderboard.userId],
    references: [users.id],
  }),
}));

export const game5LeaderboardRelations = relations(game5Leaderboard, ({ one }) => ({
  user: one(users, {
    fields: [game5Leaderboard.userId],
    references: [users.id],
  }),
}));

export const game6LeaderboardRelations = relations(game6Leaderboard, ({ one }) => ({
  user: one(users, {
    fields: [game6Leaderboard.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true, 
  totalPoints: true, 
  gamesPlayed: true, 
  achievements: true, 
  credits: true 
});



export const insertGlobalLeaderboardSchema = createInsertSchema(globalLeaderboards).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertPaymentSchema = createInsertSchema(payments).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Removed: insertGameSessionSchema - game sessions table removed

// Removed: insertUserRegistrationSchema - registration table removed

// Individual game leaderboard insert schemas
export const insertGame1LeaderboardSchema = createInsertSchema(game1Leaderboard).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertGame2LeaderboardSchema = createInsertSchema(game2Leaderboard).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertGame3LeaderboardSchema = createInsertSchema(game3Leaderboard).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertGame4LeaderboardSchema = createInsertSchema(game4Leaderboard).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertGame5LeaderboardSchema = createInsertSchema(game5Leaderboard).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertGame6LeaderboardSchema = createInsertSchema(game6Leaderboard).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Insert types - manually define for better compatibility
export type InsertUser = {
  username: string;
  password: string;
  email: string;
  solanaWallet?: string | null;
  faction?: "oni" | "mud" | "ustur" | null;
};

export type InsertGlobalLeaderboard = {
  userId: number;
  totalPoints: number;
  rank: number;
  lastUpdated?: Date;
};

export type InsertGame1Leaderboard = {
  userId: number;
  username: string;
  score: number;
  points: number;
  playedAt?: Date;
  leaderboardType: "monthly" | "yearly";
  periodStart: Date;
  periodEnd: Date;
};

export type InsertGame2Leaderboard = InsertGame1Leaderboard;
export type InsertGame3Leaderboard = InsertGame1Leaderboard;
export type InsertGame4Leaderboard = InsertGame1Leaderboard;
export type InsertGame5Leaderboard = InsertGame1Leaderboard;
export type InsertGame6Leaderboard = InsertGame1Leaderboard;

// Select types
export type User = typeof users.$inferSelect;
export type GlobalLeaderboard = typeof globalLeaderboards.$inferSelect;
// Removed: GameSession type - game sessions table removed
// Removed: UserRegistration type - registration table removed
export type Game1Leaderboard = typeof game1Leaderboard.$inferSelect;
export type Game2Leaderboard = typeof game2Leaderboard.$inferSelect;
export type Game3Leaderboard = typeof game3Leaderboard.$inferSelect;
export type Game4Leaderboard = typeof game4Leaderboard.$inferSelect;
export type Game5Leaderboard = typeof game5Leaderboard.$inferSelect;
export type Game6Leaderboard = typeof game6Leaderboard.$inferSelect;

// Update user profile type
export type UpdateUserProfile = {
  faction?: "oni" | "mud" | "ustur";
  email?: string;
  solanaWallet?: string;
  credits?: number;
};