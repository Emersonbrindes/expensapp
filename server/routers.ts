import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  expenses: router({
    list: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) return {};
        const obj = val as Record<string, unknown>;
        return {
          startDate: obj.startDate instanceof Date ? obj.startDate : undefined,
          endDate: obj.endDate instanceof Date ? obj.endDate : undefined,
        };
      })
      .query(async ({ ctx, input }) => {
        return db.getUserExpenses(ctx.user.id, input.startDate, input.endDate);
      }),
    create: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        const statusVal = obj.status;
        const status = (statusVal === 'planned' || statusVal === 'completed' || statusVal === 'cancelled') ? statusVal : 'planned';
        return {
          description: String(obj.description || ''),
          amount: Number(obj.amount || 0),
          date: obj.date instanceof Date ? obj.date : new Date(),
          categoryId: typeof obj.categoryId === 'number' ? obj.categoryId : undefined,
          notes: typeof obj.notes === 'string' ? obj.notes : undefined,
          status: status as 'planned' | 'completed' | 'cancelled',
        };
      })
      .mutation(async ({ ctx, input }) => {
        return db.createExpense(ctx.user.id, input);
      }),
    update: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        const statusVal = obj.status;
        const status = (statusVal === 'planned' || statusVal === 'completed' || statusVal === 'cancelled') ? statusVal : undefined;
        return {
          id: Number(obj.id || 0),
          description: typeof obj.description === 'string' ? obj.description : undefined,
          amount: typeof obj.amount === 'number' ? obj.amount : undefined,
          date: obj.date instanceof Date ? obj.date : undefined,
          categoryId: typeof obj.categoryId === 'number' ? obj.categoryId : undefined,
          notes: typeof obj.notes === 'string' ? obj.notes : undefined,
          status: status as 'planned' | 'completed' | 'cancelled' | undefined,
        };
      })
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateExpense(id, ctx.user.id, data);
      }),
    delete: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return Number(obj.id || 0);
      })
      .mutation(async ({ ctx, input }) => {
        return db.deleteExpense(input, ctx.user.id);
      }),
  }),

  categories: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserCategories(ctx.user.id);
    }),
    create: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return {
          name: String(obj.name || ''),
          color: typeof obj.color === 'string' ? obj.color : '#3B82F6',
        };
      })
      .mutation(async ({ ctx, input }) => {
        return db.createCategory(ctx.user.id, input.name, input.color);
      }),
    delete: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return Number(obj.id || 0);
      })
      .mutation(async ({ ctx, input }) => {
        return db.deleteCategory(input, ctx.user.id);
      }),
  }),

  workWeeks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserWorkWeeks(ctx.user.id);
    }),
    create: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return {
          weekStartDate: obj.weekStartDate instanceof Date ? obj.weekStartDate : new Date(),
          weekEndDate: obj.weekEndDate instanceof Date ? obj.weekEndDate : new Date(),
          workDays: String(obj.workDays || '[]'),
          expenses: typeof obj.expenses === 'string' ? obj.expenses : undefined,
        };
      })
      .mutation(async ({ ctx, input }) => {
        return db.createWorkWeek(ctx.user.id, input);
      }),
    get: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return obj.weekStartDate instanceof Date ? obj.weekStartDate : new Date();
      })
      .query(async ({ ctx, input }) => {
        return db.getWorkWeek(ctx.user.id, input);
      }),
    getById: protectedProcedure
      .input((val: unknown) => {
        return Number(val || 0);
      })
      .query(async ({ ctx, input }) => {
        return db.getWorkWeekById(ctx.user.id, input);
      }),
    delete: protectedProcedure
      .input((val: unknown) => {
        return Number(val || 0);
      })
      .mutation(async ({ ctx, input }) => {
        return db.deleteWorkWeek(ctx.user.id, input);
      }),
    duplicate: protectedProcedure
      .input((val: unknown) => {
        return Number(val || 0);
      })
      .mutation(async ({ ctx, input }) => {
        return db.duplicateWorkWeek(ctx.user.id, input);
      }),
  }),

  routes: router({
    create: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return {
          workWeekId: Number(obj.workWeekId || 0),
          origin: String(obj.origin || ''),
          destination: String(obj.destination || ''),
          distance: Number(obj.distance || 0),
          dayOfWeek: Number(obj.dayOfWeek || 0),
        };
      })
      .mutation(async ({ ctx, input }) => {
        return db.createRoute(ctx.user.id, input);
      }),
    list: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return Number(obj.workWeekId || 0);
      })
      .query(async ({ ctx, input }) => {
        return db.getWorkWeekRoutes(ctx.user.id, input);
      }),
    listAll: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getAllUserRoutes(ctx.user.id);
      }),
    delete: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== 'object' || val === null) throw new Error('Invalid input');
        const obj = val as Record<string, unknown>;
        return Number(obj.id || 0);
      })
      .mutation(async ({ ctx, input }) => {
        return db.deleteRoute(input, ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
