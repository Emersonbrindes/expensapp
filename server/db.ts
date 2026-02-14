import { and, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertExpense, InsertUser, InsertWorkWeek, InsertRoute, expenseCategories, expenses, users, workWeeks, routes } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all expenses for a user, optionally filtered by date range
 */
export async function getUserExpenses(
  userId: number,
  startDate?: Date,
  endDate?: Date
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get expenses: database not available");
    return [];
  }

  const conditions = [eq(expenses.userId, userId)];

  if (startDate && endDate) {
    conditions.push(gte(expenses.date, startDate));
    conditions.push(lte(expenses.date, endDate));
  }

  return db
    .select()
    .from(expenses)
    .where(and(...conditions))
    .orderBy(desc(expenses.date));
}

/**
 * Get all expense categories for a user
 */
export async function getUserCategories(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get categories: database not available");
    return [];
  }

  return db
    .select()
    .from(expenseCategories)
    .where(eq(expenseCategories.userId, userId))
    .orderBy(expenseCategories.name);
}

/**
 * Create a new expense
 */
export async function createExpense(
  userId: number,
  data: Omit<InsertExpense, "userId">
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(expenses).values({
    ...data,
    userId,
  });

  return result;
}

/**
 * Update an existing expense
 */
export async function updateExpense(
  expenseId: number,
  userId: number,
  data: Partial<Omit<InsertExpense, "userId">>
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return db
    .update(expenses)
    .set(data)
    .where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)));
}

/**
 * Delete an expense
 */
export async function deleteExpense(expenseId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return db
    .delete(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)));
}

/**
 * Create a new expense category
 */
export async function createCategory(
  userId: number,
  name: string,
  color?: string
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return db.insert(expenseCategories).values({
    userId,
    name,
    color: color || "#3B82F6",
  });
}

/**
 * Delete an expense category
 */
export async function deleteCategory(categoryId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return db
    .delete(expenseCategories)
    .where(
      and(
        eq(expenseCategories.id, categoryId),
        eq(expenseCategories.userId, userId)
      )
    );
}

/**
 * Create a new work week
 */
export async function createWorkWeek(
  userId: number,
  data: Omit<InsertWorkWeek, "userId">
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(workWeeks).values({
    ...data,
    userId,
  });

  return result;
}

/**
 * Get work week by date range
 */
export async function getWorkWeek(
  userId: number,
  weekStartDate: Date
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get work week: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(workWeeks)
    .where(
      and(
        eq(workWeeks.userId, userId),
        eq(workWeeks.weekStartDate, weekStartDate)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a new route
 */
export async function createRoute(
  userId: number,
  data: Omit<InsertRoute, "userId">
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return db.insert(routes).values({
    ...data,
    userId,
  });
}

/**
 * Get all routes for a work week
 */
export async function getWorkWeekRoutes(
  userId: number,
  workWeekId: number
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get routes: database not available");
    return [];
  }

  return db
    .select()
    .from(routes)
    .where(
      and(
        eq(routes.userId, userId),
        eq(routes.workWeekId, workWeekId)
      )
    )
    .orderBy(routes.dayOfWeek);
}

/**
 * Get all routes for a user
 */
export async function getAllUserRoutes(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get routes: database not available");
    return [];
  }

  const result = await db
    .select()
    .from(routes)
    .where(eq(routes.userId, userId))
    .orderBy(routes.createdAt);
  
  console.log(`[getAllUserRoutes] User ${userId}: ${result.length} routes encontradas`);
  return result;
}

/**
 * Delete a route
 */
export async function deleteRoute(routeId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return db
    .delete(routes)
    .where(and(eq(routes.id, routeId), eq(routes.userId, userId)));
}

/**
 * Get all work weeks for a user
 */
export async function getUserWorkWeeks(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get work weeks: database not available");
    return [];
  }

  return db
    .select()
    .from(workWeeks)
    .where(eq(workWeeks.userId, userId))
    .orderBy(desc(workWeeks.weekStartDate));
}

/**
 * Get work week by ID
 */
export async function getWorkWeekById(userId: number, workWeekId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get work week: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(workWeeks)
    .where(
      and(
        eq(workWeeks.userId, userId),
        eq(workWeeks.id, workWeekId)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Delete a work week and its associated routes
 */
export async function deleteWorkWeek(userId: number, workWeekId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete work week: database not available");
    return { success: false };
  }

  try {
    // First delete all routes associated with this work week
    await db.delete(routes).where(
      and(
        eq(routes.workWeekId, workWeekId),
        eq(routes.userId, userId)
      )
    );

    // Then delete the work week itself
    await db.delete(workWeeks).where(
      and(
        eq(workWeeks.id, workWeekId),
        eq(workWeeks.userId, userId)
      )
    );

    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to delete work week:", error);
    return { success: false };
  }
}

/**
 * Duplicate a work week (create a copy with new dates)
 */
export async function duplicateWorkWeek(userId: number, workWeekId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot duplicate work week: database not available");
    return undefined;
  }

  try {
    // Get the original work week
    const original = await getWorkWeekById(userId, workWeekId);
    if (!original) {
      return undefined;
    }

    // Create a new work week with the same data
    const result = await createWorkWeek(userId, {
      weekStartDate: original.weekStartDate,
      weekEndDate: original.weekEndDate,
      workDays: original.workDays,
      expenses: original.expenses,
    });

    // Get the newly created work week ID from the insert result
    const newWorkWeekId = (result as any).insertId;

    // Get all routes from the original work week
    const originalRoutes = await getWorkWeekRoutes(userId, workWeekId);

    // Duplicate all routes
    if (originalRoutes.length > 0 && newWorkWeekId) {
      for (const route of originalRoutes) {
        await db.insert(routes).values({
          userId,
          workWeekId: newWorkWeekId,
          origin: route.origin,
          destination: route.destination,
          distance: route.distance,
          dayOfWeek: route.dayOfWeek,
        });
      }
    }

    // Return the newly created work week
    return await getWorkWeekById(userId, newWorkWeekId);
  } catch (error) {
    console.error("[Database] Failed to duplicate work week:", error);
    return undefined;
  }
}

// TODO: add feature queries here as your schema grows.
