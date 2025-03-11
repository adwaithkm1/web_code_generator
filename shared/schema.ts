import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  googleId: text("google_id").unique(),
  rateLimit: integer("rate_limit").notNull().default(50),
  rememberMe: boolean("remember_me").default(false),
});

export const sharedCode = pgTable("shared_code", {
  id: serial("id").primaryKey(),
  shareId: text("share_id").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  language: text("language").notNull(),
  prompt: text("prompt").notNull(),
  code: text("code").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  isPublic: boolean("is_public").default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSharedCodeSchema = createInsertSchema(sharedCode).pick({
  language: true,
  prompt: true,
  code: true,
  isPublic: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SharedCode = typeof sharedCode.$inferSelect;
export type InsertSharedCode = z.infer<typeof insertSharedCodeSchema>;

// Expanded language support
export const SUPPORTED_LANGUAGES = [
  // Programming Languages
  'assembly', 'c', 'cpp', 'csharp', 'java', 'python', 'javascript', 'typescript',
  'swift', 'kotlin', 'rust', 'go', 'php', 'ruby', 'dart', 'r', 'scala', 'perl',
  'lua', 'haskell',

  // Web Development
  'html', 'css', 'react', 'angular', 'vue', 'svelte', 'nextjs', 'nuxtjs',
  'tailwindcss',

  // Backend & Databases
  'nodejs', 'django', 'flask', 'express', 'springboot', 'aspnet', 'laravel',
  'graphql', 'rest', 'mysql',

  // Security & Hacking
  'hashing', 'encryption', 'steganography', 'keylogger', 'reverseshell',
  'sqlinjection', 'xss', 'csrf', 'bufferoverflow', 'zeroday',

  // System & Low Level
  'kernel', 'bios', 'driver', 'memory', 'shellcode', 'bootloader', 'firmware',

  // AI & ML
  'tensorflow', 'pytorch', 'neuralnetwork', 'deeplearning', 'nlp',
  'reinforcementlearning',

  // Shell Scripting
  'powershell', 'bash', 'batch',

  // Others
  'blockchain', 'smartcontract', 'quantum', 'microservices', 'docker', 'kubernetes'
] as const;

export const CATEGORIES = [
  'Programming Languages',
  'Web Development',
  'Backend & Databases',
  'Security & Hacking',
  'System Programming',
  'AI & Machine Learning',
  'Shell Scripting',
  'DevOps & Cloud',
  'Blockchain & Web3',
  'Other'
] as const;

export const codeGenerationSchema = z.object({
  prompt: z.string().min(1).max(1000),
  language: z.enum(SUPPORTED_LANGUAGES),
  category: z.enum(CATEGORIES).optional(),
});

export type CodeGenerationRequest = z.infer<typeof codeGenerationSchema>;

export const codeSearchSchema = z.object({
  query: z.string().min(1).max(100),
  category: z.enum(CATEGORIES).optional(),
  language: z.enum(SUPPORTED_LANGUAGES).optional(),
});

export type CodeSearchRequest = z.infer<typeof codeSearchSchema>;