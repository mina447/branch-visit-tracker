import { z } from "zod";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { visits, managers, branches, users, locationLogs } from "../drizzle/schema";
import { storagePut } from "./storage";
import { getDistanceMeters } from "../shared/utils";

export const visitRouter = router({
  // POST — manager checks in to a branch
  checkIn: protectedProcedure
    .input(
      z.object({
        branchId: z.number(),
        latitude: z.string(),
        longitude: z.string(),
        accuracy: z.string().optional(),
        // base64 photo (optional)
        photoBase64: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Find manager profile
      const managerResult = await db
        .select()
        .from(managers)
        .where(eq(managers.userId, ctx.user!.id))
        .limit(1);

      if (!managerResult[0]) throw new Error("Manager profile not found");
      const manager = managerResult[0];

      // Check if already checked in
      const existingVisits = await db
        .select({ id: visits.id })
        .from(visits)
        .where(
          and(
            eq(visits.managerId, manager.id),
            eq(visits.status, "checked_in")
          )
        )
        .limit(1);

      if (existingVisits.length > 0) {
        throw new Error("Already checked into a branch. Please check out first.");
      }

      // Find branch details to calculate distance
      const branchResult = await db
        .select()
        .from(branches)
        .where(eq(branches.id, input.branchId))
        .limit(1);

      if (!branchResult[0]) throw new Error("Branch not found");
      const branch = branchResult[0];

      // Server-side geofencing check
      const dist = getDistanceMeters(
        parseFloat(input.latitude),
        parseFloat(input.longitude),
        parseFloat(branch.latitude),
        parseFloat(branch.longitude)
      );

      // Add a 50m tolerance for GPS inaccuracy
      if (dist > (branch.geofenceRadiusMeters || 200) + 50) {
        throw new Error("You are too far from the branch to check in.");
      }

      // Upload photo if provided
      let photoUrl: string | undefined;
      if (input.photoBase64) {
        const buffer = Buffer.from(
          input.photoBase64.replace(/^data:image\/\w+;base64,/, ""),
          "base64"
        );
        const stored = await storagePut(
          `visits/${manager.id}_${Date.now()}.jpg`,
          buffer,
          "image/jpeg"
        );
        photoUrl = stored.url;
      }

      await db.insert(visits).values({
        managerId: manager.id,
        branchId: input.branchId,
        latitudeIn: input.latitude,
        longitudeIn: input.longitude,
        accuracyIn: input.accuracy,
        photoUrl,
        notes: input.notes,
        status: "checked_in",
      });

      return { success: true };
    }),

  // POST — manager checks out
  checkOut: protectedProcedure
    .input(z.object({ visitId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const managerResult = await db
        .select()
        .from(managers)
        .where(eq(managers.userId, ctx.user!.id))
        .limit(1);

      if (!managerResult[0]) throw new Error("Manager profile not found");

      await db
        .update(visits)
        .set({ checkOutAt: new Date(), status: "checked_out" })
        .where(
          and(
            eq(visits.id, input.visitId),
            eq(visits.managerId, managerResult[0].id)
          )
        );

      return { success: true };
    }),

  // GET — current manager's visit history
  myHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const managerResult = await db
        .select()
        .from(managers)
        .where(eq(managers.userId, ctx.user!.id))
        .limit(1);

      if (!managerResult[0]) return { items: [], total: 0 };

      const managerId = managerResult[0].id;
      const whereClause = eq(visits.managerId, managerId);

      const [{ total }] = await db
        .select({ total: count() })
        .from(visits)
        .where(whereClause);

      const items = await db
        .select({
          id: visits.id,
          checkInAt: visits.checkInAt,
          checkOutAt: visits.checkOutAt,
          status: visits.status,
          photoUrl: visits.photoUrl,
          notes: visits.notes,
          latitudeIn: visits.latitudeIn,
          longitudeIn: visits.longitudeIn,
          branchName: branches.name,
          branchId: branches.id,
          branchCode: branches.code,
          branchAddress: branches.address,
        })
        .from(visits)
        .innerJoin(branches, eq(visits.branchId, branches.id))
        .where(whereClause)
        .orderBy(desc(visits.checkInAt))
        .limit(input.limit)
        .offset(input.offset);

      return { items, total };
    }),

  // GET — admin: all visits with filters
  adminList: adminProcedure
    .input(
      z.object({
        managerId: z.number().optional(),
        branchId: z.number().optional(),
        startDate: z.string().optional(), // ISO date string
        endDate: z.string().optional(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [];
      if (input.managerId) conditions.push(eq(visits.managerId, input.managerId));
      if (input.branchId) conditions.push(eq(visits.branchId, input.branchId));
      if (input.startDate)
        conditions.push(gte(visits.checkInAt, new Date(input.startDate)));
      if (input.endDate)
        conditions.push(lte(visits.checkInAt, new Date(input.endDate)));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [{ total }] = await db
        .select({ total: count() })
        .from(visits)
        .innerJoin(managers, eq(visits.managerId, managers.id))
        .innerJoin(users, eq(managers.userId, users.id))
        .where(whereClause);

      const items = await db
        .select({
          id: visits.id,
          checkInAt: visits.checkInAt,
          checkOutAt: visits.checkOutAt,
          status: visits.status,
          photoUrl: visits.photoUrl,
          notes: visits.notes,
          branchName: branches.name,
          branchId: branches.id,
          branchCode: branches.code,
          managerName: users.name,
          managerEmail: users.email,
        })
        .from(visits)
        .innerJoin(branches, eq(visits.branchId, branches.id))
        .innerJoin(managers, eq(visits.managerId, managers.id))
        .innerJoin(users, eq(managers.userId, users.id))
        .where(whereClause)
        .orderBy(desc(visits.checkInAt))
        .limit(input.limit)
        .offset(input.offset);

      return { items, total };
    }),

  // GET — admin dashboard stats
  stats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [totalBranches] = await db
      .select({ count: count() })
      .from(branches)
      .where(eq(branches.isActive, "yes"));

    const [totalManagers] = await db
      .select({ count: count() })
      .from(managers)
      .where(eq(managers.isActive, "yes"));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayVisits = await db
      .select({ id: visits.id })
      .from(visits)
      .where(gte(visits.checkInAt, today));

    return {
      totalBranches: totalBranches?.count ?? 0,
      totalManagers: totalManagers?.count ?? 0,
      todayVisits: todayVisits.length,
    };
  }),

  // GET — admin: recent visits for the dashboard activity feed
  recentVisits: adminProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const items = await db
        .select({
          id: visits.id,
          checkInAt: visits.checkInAt,
          checkOutAt: visits.checkOutAt,
          status: visits.status,
          branchName: branches.name,
          managerName: users.name,
        })
        .from(visits)
        .innerJoin(branches, eq(visits.branchId, branches.id))
        .innerJoin(managers, eq(visits.managerId, managers.id))
        .innerJoin(users, eq(managers.userId, users.id))
        .orderBy(desc(visits.checkInAt))
        .limit(input.limit);

      return items;
    }),

  // POST — sync offline tracking data (location logs + background check-ins)
  syncOfflineData: protectedProcedure
    .input(
      z.object({
        locations: z.array(
          z.object({
            latitude: z.string(),
            longitude: z.string(),
            accuracy: z.string().optional(),
            timestamp: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const managerResult = await db
        .select()
        .from(managers)
        .where(eq(managers.userId, ctx.user!.id))
        .limit(1);

      if (!managerResult[0]) throw new Error("Manager profile not found");
      const manager = managerResult[0];

      // Bulk insert location logs
      if (input.locations.length > 0) {
        const valuesToInsert = input.locations.map((loc) => ({
          managerId: manager.id,
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
          timestamp: new Date(loc.timestamp),
          syncedAt: new Date(),
        }));
        // Drizzle batch insert
        await db.insert(locationLogs).values(valuesToInsert);
      }

      return { success: true, syncedLocations: input.locations.length };
    }),
});
