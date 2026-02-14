import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Expense categories for organizing and filtering expenses
 */
export const expenseCategories = mysqlTable("expenseCategories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }).default("#3B82F6").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = typeof expenseCategories.$inferInsert;

/**
 * Expenses table for tracking weekly expense planning
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  categoryId: int("categoryId").references(() => expenseCategories.id),
  description: varchar("description", { length: 255 }).notNull(),
  amount: int("amount").notNull(), // Store as cents to avoid decimal issues
  date: timestamp("date").notNull(), // Date when the expense will occur
  notes: text("notes"),
  status: mysqlEnum("status", ["planned", "completed", "cancelled"]).default("planned").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Work weeks table for tracking which days a representative works
 */
export const workWeeks = mysqlTable("workWeeks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  weekStartDate: timestamp("weekStartDate").notNull(),
  weekEndDate: timestamp("weekEndDate").notNull(),
  workDays: varchar("workDays", { length: 255 }).notNull(),
  expenses: text("expenses"), // JSON string containing all expenses for the week
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkWeek = typeof workWeeks.$inferSelect;
export type InsertWorkWeek = typeof workWeeks.$inferInsert;

/**
 * Routes table for tracking city-to-city travel and distance
 */
export const routes = mysqlTable("routes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  workWeekId: int("workWeekId").notNull().references(() => workWeeks.id),
  origin: varchar("origin", { length: 100 }).notNull(),
  destination: varchar("destination", { length: 100 }).notNull(),
  distance: int("distance").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Route = typeof routes.$inferSelect;
export type InsertRoute = typeof routes.$inferInsert;