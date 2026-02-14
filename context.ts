import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getDb } from "../db";
import { user as userTable } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Simplified authentication: get or create a default user
    const db = await getDb();
    if (!db) {
      console.warn('[Auth] Database not available');
      return { req: opts.req, res: opts.res, user: null };
    }

    const users = await db.select().from(userTable).limit(1);
    
    if (users.length === 0) {
      // Create default user if none exists
      const [newUser] = await db.insert(userTable).values({
        openId: 'default-user',
        name: 'ExpensApp User',
        role: 'user',
      }).returning();
      user = newUser;
    } else {
      user = users[0];
    }
  } catch (error) {
    console.error('Error getting user:', error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
