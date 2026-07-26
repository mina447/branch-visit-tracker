import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, adminProcedure } from "./_core/trpc";
import { branchRouter } from "./branchRouter";
import { managerRouter } from "./managerRouter";
import { visitRouter } from "./visitRouter";
import * as db from "./db";
import { hashPassword } from "./auth";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    // GET current session user
    me: publicProcedure.query(opts => opts.ctx.user),

    // POST logout
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Admin: create new user accounts (managers, other admins)
  users: router({
    list: adminProcedure.query(() => db.listUsers()),

    create: adminProcedure
      .input(z.object({
        username: z.string().min(3).max(64),
        password: z.string().min(6),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["user", "admin"]).default("user"),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.getUserByUsername(input.username);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "اسم المستخدم موجود بالفعل" });
        const passwordHash = await hashPassword(input.password);
        await db.createUser({
          username: input.username,
          passwordHash,
          name: input.name ?? null,
          email: input.email ?? null,
          role: input.role,
          lastSignedIn: new Date(),
        });
        return { success: true };
      }),
  }),

  branch: branchRouter,
  manager: managerRouter,
  visit: visitRouter,
});

export type AppRouter = typeof appRouter;
