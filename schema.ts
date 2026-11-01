import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tokens = pgTable("tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  decimals: integer("decimals").notNull().default(6),
  description: text("description").notNull().default(""),
  supply: text("supply").notNull(),
  imageData: text("image_data"),
  imageMime: text("image_mime"),
  website: text("website"),
  twitter: text("twitter"),
  telegram: text("telegram"),
  wallet: text("wallet").notNull(),
  mintAddress: text("mint_address"),
  signature: text("signature"),
  status: text("status").notNull().default("pending"),
  revokeMint: boolean("revoke_mint").notNull().default(false),
  revokeFreeze: boolean("revoke_freeze").notNull().default(false),
  feeSol: doublePrecision("fee_sol").notNull().default(0),
  network: text("network").notNull().default("devnet"),
  featured: boolean("featured").notNull().default(false),
  hidden: boolean("hidden").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const revocations = pgTable("revocations", {
  id: serial("id").primaryKey(),
  mintAddress: text("mint_address").notNull(),
  wallet: text("wallet").notNull(),
  type: text("type").notNull(), // "mint" | "freeze"
  signature: text("signature").notNull(),
  feeSol: doublePrecision("fee_sol").notNull().default(0),
  network: text("network").notNull().default("devnet"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Token = typeof tokens.$inferSelect;
export type Revocation = typeof revocations.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type Message = typeof messages.$inferSelect;
