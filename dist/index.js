var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  areaManagerSchedules: () => areaManagerSchedules,
  branches: () => branches,
  locationLogs: () => locationLogs,
  managerBranches: () => managerBranches,
  managers: () => managers,
  users: () => users,
  visits: () => visits
});
import { decimal, int, index, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
var users, branches, managers, managerBranches, visits, locationLogs, areaManagerSchedules;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      username: varchar("username", { length: 64 }).notNull().unique(),
      passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      role: mysqlEnum("role", ["user", "admin", "superadmin", "area_manager", "branch_manager"]).default("area_manager").notNull(),
      // ── نظام التشغيل الخاص بالمدير ──────────────────────────────────────────────
      // android = يعمل فقط من التطبيق النيتف (لا ويب)
      // ios     = يعمل من المتصفح (Safari) — تسجيل يدوي دائماً بدون geofence تلقائي
      os: mysqlEnum("os", ["android", "ios"]).default("android").notNull(),
      // وضع تسجيل الحضور: automatic = الجيوفنس يدخل ويخرج تلقائياً
      // manual = المدير يضغط يدوياً على دخول/خروج
      checkinMode: mysqlEnum("checkinMode", ["automatic", "manual"]).default("automatic").notNull(),
      // ── ربط الجهاز (Device Binding) ────────────────────────────────────────────
      // بصمة الموبايل المسموح له فقط بالدخول — تُربط تلقائياً بأول تسجيل دخول
      // من التطبيق، والأدمن يقدر يفكها من لوحة التحكم لو المستخدم غيّر جهازه
      boundDeviceId: varchar("boundDeviceId", { length: 128 }),
      deviceBoundAt: timestamp("deviceBoundAt"),
      // ── ربط المتصفح (Web Fingerprint Binding) ──────────────────────────────────
      // بصمة المتصفح/الجهاز المسموح له بالدخول من الويب (Safari/Chrome على الآيفون)
      // تُربط تلقائياً بأول تسجيل دخول من المتصفح
      // الأدمن يقدر يفكها لو المدير بدّل موبايل آيفون
      boundWebFingerprint: varchar("boundWebFingerprint", { length: 256 }),
      webFingerprintAt: timestamp("webFingerprintAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    branches = mysqlTable("branches", {
      id: int("id").autoincrement().primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      code: varchar("code", { length: 64 }).notNull().unique(),
      address: text("address"),
      latitude: text("latitude").notNull(),
      longitude: text("longitude").notNull(),
      geofenceRadiusMeters: int("geofenceRadiusMeters").default(200).notNull(),
      isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    managers = mysqlTable("managers", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      employeeCode: varchar("employeeCode", { length: 64 }),
      phone: varchar("phone", { length: 32 }),
      photoUrl: varchar("photoUrl", { length: 512 }),
      isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    managerBranches = mysqlTable("managerBranches", {
      id: int("id").autoincrement().primaryKey(),
      managerId: int("managerId").notNull(),
      branchId: int("branchId").notNull(),
      // ⭐ الفرع الأساسي: "yes" = فرع مسؤولية مباشرة، "no" = فرع مسموح به فقط
      isPrimary: mysqlEnum("isPrimary", ["yes", "no"]).default("no").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    }, (table) => [
      index("idx_managerBranches_manager").on(table.managerId)
    ]);
    visits = mysqlTable("visits", {
      id: int("id").autoincrement().primaryKey(),
      managerId: int("managerId").notNull(),
      // branchId قابل للـ null عشان المأموريات الخارجية (زيارات العملاء خارج الفروع)
      branchId: int("branchId"),
      // نوع الزيارة: branch = زيارة فرع عادية، external_mission = مأمورية خارجية
      visitType: mysqlEnum("visitType", ["branch", "external_mission"]).default("branch").notNull(),
      // noteType: short_visit = سبب الزيارة القصيرة، non_primary = سبب زيارة فرع غير أساسي
      noteType: mysqlEnum("noteType", ["general", "short_visit", "non_primary", "external_mission"]).default("general").notNull(),
      // ── نطاق المأمورية الخارجية التلقائي (جيوفنس) ──────────────────────────────
      // مركز المأمورية ونصف قطرها بالمتر — يُخزن عند checkIn لمأمورية external_mission فقط
      // ويُستخدم للخروج التلقائي لما المدير يخرج من نطاق المأمورية
      missionLatitude: text("missionLatitude"),
      missionLongitude: text("missionLongitude"),
      missionRadiusMeters: int("missionRadiusMeters").default(200),
      // ── أقرب فرع للمأمورية الخارجية — يُخزن عند checkIn لمأمورية external_mission فقط ──
      // ليعرف الأدمن أقرب فرع للإحداثيات المسجلة ومدى بعدها عنه
      nearestBranchId: int("nearestBranchId"),
      nearestBranchName: varchar("nearestBranchName", { length: 255 }),
      nearestBranchDistanceKm: decimal("nearestBranchDistanceKm", { precision: 8, scale: 2 }),
      checkInAt: timestamp("checkInAt").defaultNow().notNull(),
      checkOutAt: timestamp("checkOutAt"),
      latitudeIn: text("latitudeIn").notNull(),
      longitudeIn: text("longitudeIn").notNull(),
      accuracyIn: text("accuracyIn"),
      photoUrl: text("photoUrl"),
      notes: text("notes"),
      status: mysqlEnum("status", ["checked_in", "checked_out"]).default("checked_in").notNull(),
      isMocked: mysqlEnum("isMocked", ["yes", "no"]).default("no").notNull(),
      distanceToPrevBranchKm: decimal("distanceToPrevBranchKm", { precision: 8, scale: 2 }),
      // المسافة بالكيلومتر من الفرع السابق — decimal عشان يحفظ الكسور (7.5 كم مثلاً)
      // ── نظام كشف التلاعب المتقدم ──────────────────────────────────────────────
      // suspicionScore: مجموع نقاط الشك (0 = نظيف، كل طبقة بتضيف نقاط)
      // 0–24   → نظيف
      // 25–49  → مريب — يستحق مراجعة
      // 50–74  → مشبوه جداً
      // 75+    → وهمي على الأرجح
      suspicionScore: int("suspicionScore").default(0).notNull(),
      // mockReasons: JSON array بأسباب الشك — بيساعد الأدمن يفهم ليه اتعلمت مشبوهة
      // مثال: ["DEVELOPER_OPTIONS_ON", "ACCURACY_PERFECT_INTEGER", "SENSOR_STATIONARY"]
      mockReasons: text("mockReasons"),
      // ── اعتماد المأموريات الخارجية — المأمورية الجديدة تتسجل "pending" ويُراجعها الأدمن ──
      // default "approved" عشان الصفوف القديمة وزيارات الفروع تبقى معتمدة تلقائياً
      approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("approved"),
      reviewedAt: timestamp("reviewedAt"),
      reviewedByUserId: int("reviewedByUserId"),
      // ── بيانات تقييم الخروج (Checklist) ─────────────────────────────────────────
      // JSON يُخزن نتيجة مودال التقييم الإلزامي عند الخروج (area_manager + branch_manager)
      // مثال: {"uniform":4,"collections":true,"inventoryCount":false,"cleanliness":5,
      //         "transfers":true,"transfersRating":3,"shortages":true,"shortageItems":["قهوة","شاي"],"audit":false}
      visitChecklistData: text("visitChecklistData"),
      // هل تم تسجيل الخروج تلقائياً (geofence) ولم يكتمل التقييم بعد؟
      checklistPending: mysqlEnum("checklistPending", ["yes", "no"]).default("no").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    }, (table) => [
      // فهرس التاريخ الرئيسي — كل استعلامات السجل والتقارير بتمشي عليه
      index("idx_visits_manager_checkin").on(table.managerId, table.checkInAt),
      // بحث الزيارة المفتوحة (checked_in) لكل مدير
      index("idx_visits_manager_status").on(table.managerId, table.status),
      // فهرس الترتيب الزمني العام — recentVisits/adminList/stats بترتب وتفلتر بـ checkInAt لوحده
      index("idx_visits_checkin_at").on(table.checkInAt)
    ]);
    locationLogs = mysqlTable("locationLogs", {
      id: int("id").autoincrement().primaryKey(),
      managerId: int("managerId").notNull(),
      latitude: text("latitude").notNull(),
      longitude: text("longitude").notNull(),
      accuracy: text("accuracy"),
      timestamp: timestamp("timestamp").notNull(),
      // The actual time the location was recorded on device
      syncedAt: timestamp("syncedAt").defaultNow().notNull()
      // When it was sent to server
    }, (table) => [
      // التتبع اللحظي + مسار اليوم كله بيقرأوا من الفهرس ده
      index("idx_locationLogs_manager_timestamp").on(table.managerId, table.timestamp)
    ]);
    areaManagerSchedules = mysqlTable("areaManagerSchedules", {
      id: int("id").autoincrement().primaryKey(),
      // managerId يشير إلى جدول managers (مش users مباشرة)
      managerId: int("managerId").notNull(),
      branchId: int("branchId").notNull(),
      // 0=الأحد، 1=الإثنين، 2=الثلاثاء، 3=الأربعاء، 4=الخميس، 5=الجمعة، 6=السبت
      dayOfWeek: int("dayOfWeek").notNull(),
      // وقت الزيارة المخطط (HH:MM) اختياري
      plannedTime: varchar("plannedTime", { length: 5 }),
      // ملاحظة شخصية اختيارية
      note: text("note"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    }, (table) => [
      index("idx_schedule_manager_day").on(table.managerId, table.dayOfWeek)
    ]);
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  createUser: () => createUser,
  deleteUser: () => deleteUser,
  getDb: () => getDb,
  getUserById: () => getUserById,
  getUserByUsername: () => getUserByUsername,
  listUsers: () => listUsers,
  updateLastSignedIn: () => updateLastSignedIn,
  updateUser: () => updateUser
});
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
function createPool() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      idleTimeout: 3e4,
      enableKeepAlive: true,
      keepAliveInitialDelay: 1e4,
      ssl: {
        rejectUnauthorized: false
      }
    });
    return pool;
  } catch (error) {
    console.warn("[Database] Failed to create pool:", error);
    return null;
  }
}
async function getDb() {
  if (!_db) {
    if (!_pool) _pool = createPool();
    if (_pool) {
      try {
        _db = drizzle(_pool, { schema: schema_exports, mode: "default" });
        console.log("[Database] \u2705 Pool connected");
      } catch (error) {
        console.warn("[Database] Failed to init drizzle:", error);
        _db = null;
      }
    }
  }
  return _db;
}
async function withRetry(fn, retries = 3) {
  try {
    return await fn();
  } catch (err) {
    const isConnError = err?.cause?.code === "ER_NET_READ_INTERRUPTED" || err?.cause?.code === "ECONNRESET" || err?.cause?.code === "PROTOCOL_CONNECTION_LOST" || err?.code === "PROTOCOL_CONNECTION_LOST" || err?.code === "ECONNRESET";
    if (retries > 0 && isConnError) {
      console.warn(`[Database] Connection lost, retrying query... (${retries} left)`);
      await new Promise((r) => setTimeout(r, 500));
      return withRetry(fn, retries - 1);
    }
    throw err;
  }
}
async function getUserById(id) {
  return withRetry(async () => {
    const db = await getDb();
    if (!db) return void 0;
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] ?? void 0;
  });
}
async function getUserByUsername(username) {
  return withRetry(async () => {
    const db = await getDb();
    if (!db) return void 0;
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] ?? void 0;
  });
}
async function createUser(user) {
  return withRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.insert(users).values(user);
  });
}
async function updateLastSignedIn(id) {
  return withRetry(async () => {
    const db = await getDb();
    if (!db) return;
    await db.update(users).set({ lastSignedIn: /* @__PURE__ */ new Date() }).where(eq(users.id, id));
  });
}
async function listUsers(isSuperAdmin = false) {
  return withRetry(async () => {
    const db = await getDb();
    if (!db) return [];
    const { ne: ne3 } = await import("drizzle-orm");
    const query = db.select({
      id: users.id,
      username: users.username,
      name: users.name,
      email: users.email,
      role: users.role,
      os: users.os,
      checkinMode: users.checkinMode,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
      boundDeviceId: users.boundDeviceId,
      deviceBoundAt: users.deviceBoundAt,
      boundWebFingerprint: users.boundWebFingerprint,
      webFingerprintAt: users.webFingerprintAt
    }).from(users).orderBy(users.name);
    if (!isSuperAdmin) {
      return query.where(ne3(users.role, "superadmin"));
    }
    return query;
  });
}
async function updateUser(id, data) {
  return withRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(users).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id));
  });
}
async function deleteUser(id) {
  return withRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(users).where(eq(users.id, id));
  });
}
var _pool, _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_schema();
    _pool = null;
    _db = null;
  }
});

// server/_core/env.ts
import "dotenv/config";
function requireEnv(key) {
  const val = process.env[key];
  if (!val) {
    throw new Error(
      `[env] Missing required environment variable: ${key}
  Copy .env.example to .env and fill in the values.`
    );
  }
  return val;
}
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      // Required
      jwtSecret: process.env.NODE_ENV === "production" ? requireEnv("JWT_SECRET") : process.env.JWT_SECRET ?? "dev-only-insecure-secret-change-in-production",
      databaseUrl: process.env.DATABASE_URL ?? "",
      // Context
      isProduction: process.env.NODE_ENV === "production",
      isDevelopment: process.env.NODE_ENV !== "production",
      // Optional: AWS S3 for photo storage (falls back to local /uploads)
      awsS3Bucket: process.env.AWS_S3_BUCKET ?? "",
      awsRegion: process.env.AWS_REGION ?? "us-east-1",
      // Optional: AI features (LLM, image generation, voice)
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/_core/notification.ts
var notification_exports = {};
__export(notification_exports, {
  notifyOwner: () => notifyOwner
});
import { TRPCError as TRPCError2 } from "@trpc/server";
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError2({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError2({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}
var TITLE_MAX_LENGTH, CONTENT_MAX_LENGTH, trimValue, isNonEmptyString, buildEndpointUrl, validatePayload;
var init_notification = __esm({
  "server/_core/notification.ts"() {
    "use strict";
    init_env();
    TITLE_MAX_LENGTH = 1200;
    CONTENT_MAX_LENGTH = 2e4;
    trimValue = (value) => value.trim();
    isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
    buildEndpointUrl = (baseUrl) => {
      const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
      return new URL(
        "webdevtoken.v1.WebDevService/SendNotification",
        normalizedBase
      ).toString();
    };
    validatePayload = (input) => {
      if (!isNonEmptyString(input.title)) {
        throw new TRPCError2({
          code: "BAD_REQUEST",
          message: "Notification title is required."
        });
      }
      if (!isNonEmptyString(input.content)) {
        throw new TRPCError2({
          code: "BAD_REQUEST",
          message: "Notification content is required."
        });
      }
      const title = trimValue(input.title);
      const content = trimValue(input.content);
      if (title.length > TITLE_MAX_LENGTH) {
        throw new TRPCError2({
          code: "BAD_REQUEST",
          message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
        });
      }
      if (content.length > CONTENT_MAX_LENGTH) {
        throw new TRPCError2({
          code: "BAD_REQUEST",
          message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
        });
      }
      return { title, content };
    };
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import path5 from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var SESSION_DURATION_MS = 1e3 * 60 * 60 * 24 * 30;
var UNAUTHED_ERR_MSG = "\u064A\u0631\u062C\u0649 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 (10001)";
var NOT_ADMIN_ERR_MSG = "\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function getSessionCookieOptions(req) {
  const isHttps = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https";
  return {
    httpOnly: true,
    path: "/",
    sameSite: isHttps ? "none" : "lax",
    secure: isHttps
  };
}

// server/_core/sdk.ts
init_db();
init_env();
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
var SDKServer = class {
  getSecretKey() {
    return new TextEncoder().encode(ENV.jwtSecret);
  }
  async signSession(payload, expiresInMs = SESSION_DURATION_MS) {
    const expirationSeconds = Math.floor((Date.now() + expiresInMs) / 1e3);
    return new SignJWT({ ...payload }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(this.getSecretKey());
  }
  async verifySession(cookieValue) {
    if (!cookieValue) return null;
    try {
      const { payload } = await jwtVerify(cookieValue, this.getSecretKey(), {
        algorithms: ["HS256"]
      });
      const { userId, username, role } = payload;
      if (typeof userId !== "number" || typeof username !== "string" || typeof role !== "string") {
        return null;
      }
      return { userId, username, role };
    } catch {
      return null;
    }
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) return /* @__PURE__ */ new Map();
    return new Map(Object.entries(parseCookieHeader(cookieHeader)));
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionToken = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionToken);
    if (!session) throw ForbiddenError("Invalid or missing session");
    const user = await getUserById(session.userId);
    if (!user) throw ForbiddenError("User not found");
    return user;
  }
};
var sdk = new SDKServer();

// server/auth.ts
import { randomBytes, timingSafeEqual, pbkdf2 } from "crypto";
var ITERATIONS = 1e5;
var KEYLEN = 64;
var DIGEST = "sha256";
var SEP = ":";
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(32).toString("hex");
    pbkdf2(password, salt, ITERATIONS, KEYLEN, DIGEST, (err, key) => {
      if (err) return reject(err);
      resolve(`${ITERATIONS}${SEP}${salt}${SEP}${key.toString("hex")}`);
    });
  });
}
async function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    const parts = hash.split(SEP);
    if (parts.length !== 3) return resolve(false);
    const [itersStr, salt, storedKey] = parts;
    const iters = parseInt(itersStr, 10);
    pbkdf2(password, salt, iters, KEYLEN, DIGEST, (err, key) => {
      if (err) return reject(err);
      try {
        const storedBuf = Buffer.from(storedKey, "hex");
        resolve(timingSafeEqual(key, storedBuf));
      } catch {
        resolve(false);
      }
    });
  });
}

// server/_core/oauth.ts
function registerOAuthRoutes(app) {
  app.post("/api/auth/login", async (req, res) => {
    const { username, password, platform, deviceId, webFingerprint } = req.body ?? {};
    if (!username || !password || typeof username !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "username and password are required" });
      return;
    }
    if (username.length > 64 || password.length > 256) {
      res.status(400).json({ error: "Invalid credentials format" });
      return;
    }
    try {
      const user = await getUserByUsername(username);
      if (!user) {
        await hashPassword(password);
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      const isAdmin = user.role === "admin" || user.role === "superadmin";
      if (isAdmin && platform === "mobile") {
        res.status(403).json({ error: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0639\u0627\u0645 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0646 \u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0645\u0648\u0628\u0627\u064A\u0644" });
        return;
      }
      if (!isAdmin && platform !== "mobile" && platform !== "web") {
        res.status(403).json({ error: "\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u062F\u064A\u0631 \u0645\u062E\u0635\u0635 \u0641\u0642\u0637 \u0644\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0645\u0648\u0628\u0627\u064A\u0644 \u0627\u0648 \u0627\u0644\u0645\u062A\u0635\u0641\u062D \u0627\u0644\u0631\u0633\u0645\u064A" });
        return;
      }
      if (!isAdmin && platform === "web" && user.os === "android") {
        res.status(403).json({ error: "\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u062E\u0635\u0635 \u0644\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0623\u0646\u062F\u0631\u0648\u064A\u062F \u0641\u0642\u0637 \u2014 \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0646 \u0627\u0644\u0645\u062A\u0635\u0641\u062D" });
        return;
      }
      if (!isAdmin && platform === "mobile" && user.os === "ios") {
        res.status(403).json({ error: "\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u062E\u0635\u0635 \u0644\u0645\u062A\u0635\u0641\u062D \u0627\u0644\u0622\u064A\u0641\u0648\u0646 \u0641\u0642\u0637 \u2014 \u0627\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0631\u0627\u0628\u0637 \u0639\u0628\u0631 Safari" });
        return;
      }
      if (!isAdmin) {
        if (platform === "mobile") {
          if (!deviceId || typeof deviceId !== "string" || deviceId.length < 8 || deviceId.length > 128) {
            res.status(403).json({ error: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0633\u0645\u0648\u062D \u0641\u0642\u0637 \u0645\u0646 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0631\u0633\u0645\u064A \u0639\u0644\u0649 \u0627\u0644\u0645\u0648\u0628\u0627\u064A\u0644" });
            return;
          }
          if (!user.boundDeviceId) {
            await updateUser(user.id, { boundDeviceId: deviceId, deviceBoundAt: /* @__PURE__ */ new Date() });
          } else if (user.boundDeviceId !== deviceId) {
            console.warn(
              `[Auth] Device mismatch for user ${user.username}: bound=${user.boundDeviceId.slice(0, 8)}... got=${deviceId.slice(0, 8)}...`
            );
            res.status(403).json({
              error: "\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0631\u0628\u0648\u0637 \u0628\u062C\u0647\u0627\u0632 \u0645\u0648\u0628\u0627\u064A\u0644 \u0622\u062E\u0631. \u0644\u0648 \u063A\u064A\u0631\u062A \u062C\u0647\u0627\u0632\u0643\u060C \u0643\u0644\u0645 \u0627\u0644\u0627\u062F\u0627\u0631\u0629 \u0644\u0641\u0643 \u0627\u0644\u0631\u0628\u0637."
            });
            return;
          }
        } else if (platform === "web") {
          if (!webFingerprint || typeof webFingerprint !== "string" || webFingerprint.length < 16 || webFingerprint.length > 256) {
            res.status(403).json({ error: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u062A\u0639\u0631\u0641 \u0639\u0644\u0649 \u0645\u062A\u0635\u0641\u062D\u0643 - \u062A\u0627\u0643\u062F \u0645\u0646 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0645\u062A\u0635\u0641\u062D \u0627\u0644\u0631\u0633\u0645\u064A" });
            return;
          }
          if (!user.boundWebFingerprint) {
            console.log(`[Auth] Web fingerprint bound for user ${user.username}: ${webFingerprint.slice(0, 12)}...`);
            await updateUser(user.id, {
              boundWebFingerprint: webFingerprint,
              webFingerprintAt: /* @__PURE__ */ new Date()
            });
          } else if (user.boundWebFingerprint !== webFingerprint) {
            console.warn(
              `[Auth] Web fingerprint mismatch for user ${user.username}: bound=${user.boundWebFingerprint.slice(0, 12)}... got=${webFingerprint.slice(0, 12)}...`
            );
            res.status(403).json({
              error: "\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0631\u0628\u0648\u0637 \u0628\u0645\u062A\u0635\u0641\u062D/\u062C\u0647\u0627\u0632 \u0622\u062E\u0631. \u0644\u0648 \u0628\u062F\u0651\u0644\u062A \u0645\u0648\u0628\u0627\u064A\u0644\u0643\u060C \u0643\u0644\u0645 \u0627\u0644\u0627\u062F\u0627\u0631\u0629 \u0644\u0641\u0643 \u0627\u0644\u0631\u0628\u0637."
            });
            return;
          }
        }
      }
      const token = await sdk.signSession({
        userId: user.id,
        username: user.username,
        role: user.role
      });
      await updateLastSignedIn(user.id);
      const cookieOptions = getSessionCookieOptions(req);
      const sessionDuration = platform === "web" ? 8 * 60 * 60 * 1e3 : SESSION_DURATION_MS;
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: sessionDuration });
      res.json({ success: true, user: { id: user.id, name: user.name, role: user.role, username: user.username, email: user.email } });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
}

// server/routers.ts
import { z as z6 } from "zod";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin" && ctx.user.role !== "superadmin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);
var superAdminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "superadmin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Superadmin access required" });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);
var areaManagerProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "area_manager" && ctx.user.role !== "user") {
      throw new TRPCError({ code: "FORBIDDEN", message: "\u0635\u0644\u0627\u062D\u064A\u0629 \u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0645\u0637\u0644\u0648\u0628\u0629" });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);
var branchManagerProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "branch_manager") {
      throw new TRPCError({ code: "FORBIDDEN", message: "\u0635\u0644\u0627\u062D\u064A\u0629 \u0645\u062F\u064A\u0631 \u0627\u0644\u0641\u0631\u0639 \u0645\u0637\u0644\u0648\u0628\u0629" });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);
var fieldManagerProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    const allowed = ["area_manager", "branch_manager", "user"];
    if (!ctx.user || !allowed.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "\u0635\u0644\u0627\u062D\u064A\u0629 \u0645\u062F\u064A\u0631 \u0645\u064A\u062F\u0627\u0646\u064A \u0645\u0637\u0644\u0648\u0628\u0629" });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(z.object({ timestamp: z.number().min(0) })).query(() => ({ ok: true })),
  notifyOwner: adminProcedure.input(z.object({
    title: z.string().min(1),
    content: z.string().min(1)
  })).mutation(async ({ input }) => {
    if (!process.env.BUILT_IN_FORGE_API_URL) {
      console.log(`[Notify] ${input.title}: ${input.content}`);
      return { success: false, reason: "Forge API not configured" };
    }
    try {
      const { notifyOwner: notifyOwner2 } = await Promise.resolve().then(() => (init_notification(), notification_exports));
      const delivered = await notifyOwner2(input);
      return { success: delivered };
    } catch (e) {
      console.error("[Notify] Failed:", e);
      return { success: false };
    }
  })
});

// server/branchRouter.ts
import { z as z2 } from "zod";
import { eq as eq2 } from "drizzle-orm";
init_db();
init_schema();
var branchRouter = router({
  // GET /trpc/branch.list — all branches (admin only)
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(branches).orderBy(branches.name);
  }),
  // GET /trpc/branch.get — single branch by id
  get: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(branches).where(eq2(branches.id, input.id)).limit(1);
    return result[0] ?? null;
  }),
  // POST /trpc/branch.create — admin creates a branch
  create: adminProcedure.input(
    z2.object({
      name: z2.string().min(1),
      code: z2.string().min(1),
      address: z2.string().optional(),
      latitude: z2.string(),
      longitude: z2.string(),
      geofenceRadiusMeters: z2.number().default(200)
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.insert(branches).values(input);
    return { success: true };
  }),
  // PUT /trpc/branch.update — admin updates a branch
  update: adminProcedure.input(
    z2.object({
      id: z2.number(),
      name: z2.string().min(1).optional(),
      code: z2.string().min(1).optional(),
      address: z2.string().optional(),
      latitude: z2.string().optional(),
      longitude: z2.string().optional(),
      geofenceRadiusMeters: z2.number().optional(),
      isActive: z2.enum(["yes", "no"]).optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = input;
    await db.update(branches).set(data).where(eq2(branches.id, id));
    return { success: true };
  }),
  // DELETE /trpc/branch.delete — admin deletes branch entirely
  delete: adminProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { managerBranches: managerBranches2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    await db.delete(managerBranches2).where(eq2(managerBranches2.branchId, input.id));
    await db.delete(branches).where(eq2(branches.id, input.id));
    return { success: true };
  })
});

// server/managerRouter.ts
import { z as z3 } from "zod";
import { eq as eq3, and, desc, gte, lt, inArray, or, sql, ne } from "drizzle-orm";
init_db();
init_schema();
import fs from "fs";
import path from "path";
var managerRouter = router({
  // GET — all managers with their user info (admin)
  // السوبر أدمن يرى الجميع | الأدمن العادي لا يرى superadmin
  list: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const isSuperAdmin = ctx.user?.role === "superadmin";
    const result = await db.select({
      id: managers.id,
      userId: managers.userId,
      employeeCode: managers.employeeCode,
      phone: managers.phone,
      photoUrl: managers.photoUrl,
      isActive: managers.isActive,
      createdAt: managers.createdAt,
      userName: users.name,
      userEmail: users.email,
      userRole: users.role
    }).from(managers).leftJoin(users, eq3(managers.userId, users.id)).where(isSuperAdmin ? void 0 : ne(users.role, "superadmin")).orderBy(users.name);
    return result;
  }),
  // GET — current logged-in manager's profile (for manager role)
  getCurrentManager: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(managers).where(eq3(managers.userId, ctx.user.id)).limit(1);
    return result[0] ?? null;
  }),
  // GET — branches assigned to the current manager
  getMyBranches: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const managerResult = await db.select().from(managers).where(eq3(managers.userId, ctx.user.id)).limit(1);
    if (!managerResult[0]) return [];
    const result = await db.select({
      id: branches.id,
      name: branches.name,
      code: branches.code,
      address: branches.address,
      latitude: branches.latitude,
      longitude: branches.longitude,
      geofenceRadiusMeters: branches.geofenceRadiusMeters,
      isPrimary: managerBranches.isPrimary
    }).from(managerBranches).innerJoin(branches, eq3(managerBranches.branchId, branches.id)).where(
      and(
        eq3(managerBranches.managerId, managerResult[0].id),
        eq3(branches.isActive, "yes")
      )
    );
    return result;
  }),
  // GET — الفرع الوحيد المسند لمدير الفرع (branch_manager) — فرع واحد فقط
  // يُستخدم في واجهة مدير الفرع لعرض بيانات الفرع المسند مباشرة
  getBranchManagerBranch: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    if (ctx.user.role !== "branch_manager") return null;
    const managerResult = await db.select().from(managers).where(eq3(managers.userId, ctx.user.id)).limit(1);
    if (!managerResult[0]) return null;
    const result = await db.select({
      id: branches.id,
      name: branches.name,
      code: branches.code,
      address: branches.address,
      latitude: branches.latitude,
      longitude: branches.longitude,
      geofenceRadiusMeters: branches.geofenceRadiusMeters,
      isPrimary: managerBranches.isPrimary
    }).from(managerBranches).innerJoin(branches, eq3(managerBranches.branchId, branches.id)).where(
      and(
        eq3(managerBranches.managerId, managerResult[0].id),
        eq3(branches.isActive, "yes")
      )
    ).orderBy(managerBranches.isPrimary).limit(1);
    return result[0] ?? null;
  }),
  // POST — admin creates a manager profile for an existing user
  create: adminProcedure.input(
    z3.object({
      userId: z3.number(),
      employeeCode: z3.string().optional(),
      phone: z3.string().optional(),
      photoUrl: z3.string().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.insert(managers).values(input);
    return { success: true };
  }),
  // POST — رفع صورة المدير (base64) وحفظها لوكال
  uploadPhoto: adminProcedure.input(z3.object({
    managerId: z3.number(),
    base64: z3.string().max(6e6),
    // ✅ سقف واضح (~4.5MB صورة فعلية)
    extension: z3.enum(["jpg", "jpeg", "png", "webp"]).default("jpg")
    // ✅ allowlist بدل أي امتداد
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const base64Data = input.base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    if (buffer.length === 0) throw new Error("\u0635\u0648\u0631\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629");
    const uploadsDir = path.join(process.cwd(), "uploads", "managers");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const filename = `manager_${input.managerId}_${Date.now()}.${input.extension}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, buffer);
    const photoUrl = `/uploads/managers/${filename}`;
    await db.update(managers).set({ photoUrl }).where(eq3(managers.id, input.managerId));
    return { photoUrl };
  }),
  // GET — admin: get branches currently assigned to a specific manager
  getManagerBranches: adminProcedure.input(z3.object({ managerId: z3.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select({ branchId: managerBranches.branchId, isPrimary: managerBranches.isPrimary }).from(managerBranches).innerJoin(branches, eq3(managerBranches.branchId, branches.id)).where(eq3(managerBranches.managerId, input.managerId));
    return result;
  }),
  // POST — admin assigns branches to a manager
  assignBranches: adminProcedure.input(
    z3.object({
      managerId: z3.number(),
      branches: z3.array(z3.object({
        branchId: z3.number(),
        isPrimary: z3.enum(["yes", "no"]).default("no")
      }))
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const managerResult = await db.select({ userRole: users.role }).from(managers).innerJoin(users, eq3(managers.userId, users.id)).where(eq3(managers.id, input.managerId)).limit(1);
    if (!managerResult[0]) throw new Error("Manager not found");
    if (managerResult[0].userRole === "branch_manager" && input.branches.length > 1) {
      throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0639\u064A\u064A\u0646 \u0623\u0643\u062B\u0631 \u0645\u0646 \u0641\u0631\u0639 \u0648\u0627\u062D\u062F \u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0641\u0631\u0639.");
    }
    if (input.branches.length > 0) {
      const branchIds = input.branches.map((b) => b.branchId);
      const validBranches = await db.select({ id: branches.id }).from(branches).where(inArray(branches.id, branchIds));
      const validIdSet = new Set(validBranches.map((b) => b.id));
      const invalidIds = branchIds.filter((id) => !validIdSet.has(id));
      if (invalidIds.length > 0) {
        throw new Error(`\u0627\u0644\u0641\u0631\u0648\u0639 \u0627\u0644\u062A\u0627\u0644\u064A\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629 \u0623\u0648 \u062A\u0645 \u062D\u0630\u0641\u0647\u0627: ${invalidIds.join(", ")}`);
      }
    }
    await db.delete(managerBranches).where(eq3(managerBranches.managerId, input.managerId));
    if (input.branches.length > 0) {
      await db.insert(managerBranches).values(
        input.branches.map(({ branchId, isPrimary }) => ({
          managerId: input.managerId,
          branchId,
          isPrimary
        }))
      );
    }
    return { success: true };
  }),
  // DELETE — admin deletes a manager completely
  delete: adminProcedure.input(z3.object({ id: z3.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const managerResult = await db.select().from(managers).where(eq3(managers.id, input.id)).limit(1);
    const manager = managerResult[0];
    if (!manager) {
      throw new Error("Manager not found");
    }
    await db.delete(managerBranches).where(eq3(managerBranches.managerId, input.id));
    await db.delete(locationLogs).where(eq3(locationLogs.managerId, input.id));
    await db.delete(visits).where(eq3(visits.managerId, input.id));
    await db.delete(managers).where(eq3(managers.id, input.id));
    await db.delete(users).where(eq3(users.id, manager.userId));
    return { success: true };
  }),
  // GET - admin live locations of all active managers
  // ✅ محسّن: استعلامين ثابتين بدل استعلام لكل مدير (كان N+1)
  getLiveLocations: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allManagers = await db.select({
      id: managers.id,
      userName: users.name,
      phone: managers.phone,
      photoUrl: managers.photoUrl,
      isActive: managers.isActive
    }).from(managers).innerJoin(users, eq3(managers.userId, users.id));
    if (allManagers.length === 0) return [];
    const managerIds = allManagers.map((m) => m.id);
    const latestPerManager = await db.select({
      managerId: locationLogs.managerId,
      maxTimestamp: sql`MAX(${locationLogs.timestamp})`
    }).from(locationLogs).where(inArray(locationLogs.managerId, managerIds)).groupBy(locationLogs.managerId);
    if (latestPerManager.length === 0) {
      return allManagers.map((m) => ({ ...m, location: null }));
    }
    const pointConditions = latestPerManager.map(
      (r) => and(eq3(locationLogs.managerId, r.managerId), eq3(locationLogs.timestamp, new Date(r.maxTimestamp)))
    );
    const points = await db.select({
      managerId: locationLogs.managerId,
      latitude: locationLogs.latitude,
      longitude: locationLogs.longitude,
      timestamp: locationLogs.timestamp
    }).from(locationLogs).where(pointConditions.length === 1 ? pointConditions[0] : or(...pointConditions));
    const locationByManager = new Map(points.map((p) => [p.managerId, p]));
    const modeRows = await db.select({ managerId: managers.id, checkinMode: users.checkinMode }).from(managers).innerJoin(users, eq3(managers.userId, users.id)).where(inArray(managers.id, managerIds));
    const modeByManagerId = new Map(modeRows.map((r) => [r.managerId, r.checkinMode]));
    const lastVisits = await db.select({
      managerId: visits.managerId,
      latitude: visits.latitudeIn,
      longitude: visits.longitudeIn,
      timestamp: visits.checkInAt
    }).from(visits).where(inArray(visits.managerId, managerIds)).orderBy(desc(visits.checkInAt)).limit(500);
    const lastVisitByManager = /* @__PURE__ */ new Map();
    for (const v of lastVisits) {
      if (!lastVisitByManager.has(v.managerId)) {
        lastVisitByManager.set(v.managerId, { ...v, isManualFallback: true });
      }
    }
    return allManagers.map((m) => {
      const live = locationByManager.get(m.id) ?? null;
      if (live) {
        return { ...m, checkinMode: modeByManagerId.get(m.id) ?? "automatic", location: live };
      }
      const fallback = lastVisitByManager.get(m.id) ?? null;
      return { ...m, checkinMode: modeByManagerId.get(m.id) ?? "automatic", location: fallback };
    });
  }),
  // GET - admin route history for a specific manager on a specific date
  getRouteHistory: adminProcedure.input(z3.object({ managerId: z3.number(), date: z3.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const targetDate = new Date(input.date);
    if (isNaN(targetDate.getTime())) {
      throw new Error("Invalid date format");
    }
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    const logs = await db.select({
      id: locationLogs.id,
      latitude: locationLogs.latitude,
      longitude: locationLogs.longitude,
      accuracy: locationLogs.accuracy,
      timestamp: locationLogs.timestamp
    }).from(locationLogs).where(
      and(
        eq3(locationLogs.managerId, input.managerId),
        gte(locationLogs.timestamp, startOfDay),
        lt(locationLogs.timestamp, endOfDay)
      )
    ).orderBy(locationLogs.timestamp);
    return logs;
  }),
  // GET — area_manager: get branch managers subordinate to the current area manager
  getSubordinateBranchManagers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const currentManagerResult = await db.select({ id: managers.id }).from(managers).where(eq3(managers.userId, ctx.user.id)).limit(1);
    if (!currentManagerResult[0]) return [];
    const areaManagerId = currentManagerResult[0].id;
    const areaBranches = await db.select({ branchId: managerBranches.branchId }).from(managerBranches).where(eq3(managerBranches.managerId, areaManagerId));
    if (areaBranches.length === 0) return [];
    const branchIds = areaBranches.map((b) => b.branchId);
    const subordinates = await db.select({
      managerId: managers.id,
      name: users.name,
      photoUrl: managers.photoUrl,
      phone: managers.phone,
      branchId: managerBranches.branchId,
      branchName: branches.name
    }).from(managers).innerJoin(users, eq3(managers.userId, users.id)).innerJoin(managerBranches, eq3(managerBranches.managerId, managers.id)).innerJoin(branches, eq3(managerBranches.branchId, branches.id)).where(
      and(
        eq3(users.role, "branch_manager"),
        inArray(managerBranches.branchId, branchIds),
        eq3(managers.isActive, "yes")
      )
    );
    if (subordinates.length === 0) return [];
    const subManagerIds = subordinates.map((s) => s.managerId);
    const activeVisits = await db.select({
      managerId: visits.managerId,
      checkInAt: visits.checkInAt,
      branchId: visits.branchId
    }).from(visits).where(
      and(
        inArray(visits.managerId, subManagerIds),
        eq3(visits.status, "checked_in")
      )
    );
    const activeVisitsMap = /* @__PURE__ */ new Map();
    for (const v of activeVisits) {
      activeVisitsMap.set(v.managerId, v);
    }
    return subordinates.map((s) => ({
      ...s,
      activeVisit: activeVisitsMap.get(s.managerId) || null
    }));
  })
});

// server/visitRouter.ts
import { z as z4 } from "zod";
import { eq as eq7, and as and4, or as or2, ne as ne2, gte as gte3, lte, desc as desc3, count, sql as sql2 } from "drizzle-orm";
init_db();
init_schema();

// server/storage.ts
import { randomUUID } from "crypto";
import fs2 from "fs";
import path2 from "path";
var UPLOADS_DIR = path2.join(process.cwd(), "uploads");
function ensureUploadsDir() {
  if (!fs2.existsSync(UPLOADS_DIR)) fs2.mkdirSync(UPLOADS_DIR, { recursive: true });
}
function appendHashSuffix(relKey) {
  const hash = randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const key = appendHashSuffix(relKey.replace(/^\/+/, ""));
  const s3Bucket = process.env.AWS_S3_BUCKET;
  const s3Region = process.env.AWS_REGION ?? "us-east-1";
  if (s3Bucket) {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({ region: s3Region });
    await client.send(new PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      Body: data instanceof Uint8Array ? Buffer.from(data) : data,
      ContentType: contentType
    }));
    const url2 = `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${key}`;
    return { key, url: url2 };
  }
  ensureUploadsDir();
  const filePath = path2.join(UPLOADS_DIR, key.replace(/\//g, "_"));
  fs2.writeFileSync(filePath, data instanceof Uint8Array ? Buffer.from(data) : data);
  const url = `/uploads/${path2.basename(filePath)}`;
  return { key, url };
}

// shared/utils.ts
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// server/visits/distance.ts
init_schema();
import { eq as eq4, and as and2, gte as gte2, lt as lt2, desc as desc2 } from "drizzle-orm";

// shared/gizaBranchDistances.ts
var BRANCH_NAME_TO_CODE = {
  // الجيزة
  "\u0627\u0644\u062C\u064A\u0632\u0629 : \u0627\u0644\u0634\u064A\u062E \u0632\u0627\u064A\u062F": "RAC",
  // Chill Out
  "\u0627\u0644\u062C\u064A\u0632\u0629 : \u0627\u0644\u0647\u0631\u0645": "RAU",
  // Omrania / العمرانية
  "\u0627\u0644\u062C\u064A\u0632\u0629 : \u0641\u064A\u0635\u0644 - \u0645\u0635\u0631\u0641 \u0627\u0644\u0644\u0628\u064A\u0646\u064A": "RAY",
  // Lebeeny فرع 1
  "\u0627\u0644\u062C\u064A\u0632\u0629 : \u0641\u064A\u0635\u0644 - \u0627\u0628\u0648 \u0627\u0644\u0645\u062D\u0627\u0633\u0646": "RAY",
  // Faisal فرع 2 — ✅ RAY مش RAF (كان متعارض مع اللبيني)
  "\u0627\u0644\u062C\u064A\u0632\u0629 : \u0627\u0644\u0639\u062C\u0648\u0632\u0629": "RAG",
  // Agouza
  "\u0627\u0644\u062C\u064A\u0632\u0629 : \u0627\u0644\u0645\u0647\u0646\u062F\u0633\u064A\u0646": "RAO",
  // Soudan / المهندسين سودان
  "\u0627\u0644\u062C\u064A\u0632\u0629 : \u0627\u0644\u0645\u0647\u0646\u062F\u0633\u064A\u0646 - \u0627\u0644\u0633\u0648\u062F\u0627\u0646": "RAO",
  // ✅ alias صريح للاسم الفعلي في الداتابيز
  "\u0627\u0644\u062C\u064A\u0632\u0629 : \u0627\u0643\u062A\u0648\u0628\u0631 - \u0628\u0646\u0632\u064A\u0646\u0629 \u0648\u0637\u0646\u064A\u0629": "RSW",
  // Wahat / أكتوبر
  "\u0627\u0644\u062C\u064A\u0632\u0629 : \u0627\u0643\u062A\u0648\u0628\u0631 - \u0637\u064A\u0628\u0629 \u062C\u0631\u0627\u0646\u062F \u0645\u0648\u0644": "RAT",
  // Tiba Mall
  "\u0627\u0644\u062C\u064A\u0632\u0629 : \u0625\u0645\u0628\u0627\u0628\u0629": "RAB",
  // Imbaba
  "\u0627\u0644\u062C\u064A\u0632\u0629 : \u0627\u0644\u0645\u0647\u0646\u062F\u0633\u064A\u0646 - \u0627\u0648\u062A\u0648\u0628\u0627\u0631\u062A\u0633 \u0645\u064A\u062C\u0627 \u0633\u062A\u0648\u0631": "RAL",
  // Mega Store
  "\u0627\u0644\u062C\u064A\u0632\u0629 : \u0627\u0644\u0645\u0647\u0646\u062F\u0633\u064A\u0646 - \u0645\u064A\u062C\u0627 \u0633\u062A\u0648\u0631": "RAL",
  // Alias for Mega Store
  "\u0627\u0644\u062C\u064A\u0632\u0629 : \u0641\u064A\u0635\u0644 - \u0627\u0644\u0644\u0628\u064A\u0646\u064A": "RAF",
  // Alias for Faisal Lebeeny
  // القاهرة
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u0648\u0633\u0637 \u0627\u0644\u0628\u0644\u062F - \u0645\u0639\u0631\u0648\u0641": "CAI-DT-MAAROUF",
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u0648\u0633\u0637 \u0627\u0644\u0628\u0644\u062F - \u0627\u0644\u062A\u0648\u0641\u064A\u0642\u064A\u0629": "CAI-DT-TAWFIQIA",
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u0634\u0628\u0631\u0627": "CAI-SHUBRA",
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u0634\u0628\u0631\u0627 - \u0623\u063A\u0627\u062E\u0627\u0646": "CAI-SHUBRA",
  // ✅ الاسم الفعلي في الداتابيز
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u062D\u062F\u0627\u0626\u0642 \u0627\u0644\u0642\u0628\u0629": "CAI-HADAIQ",
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u0639\u064A\u0646 \u0634\u0645\u0633": "CAI-AINSHAMS",
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u0627\u0644\u0645\u0637\u0631\u064A\u0629": "CAI-MATARIA",
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u0627\u0644\u0639\u0628\u0627\u0633\u064A\u0629": "CAI-ABBASIYA",
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u062D\u0644\u0648\u0627\u0646": "CAI-HELWAN",
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u0645\u062F\u064A\u0646\u0629 \u0646\u0635\u0631 - \u0645\u062D\u0645\u062F \u0645\u0647\u062F\u064A": "CAI-NASR-1",
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u0645\u062F\u064A\u0646\u0629 \u0646\u0635\u0631 - \u0627\u0644\u062E\u0644\u064A\u0641\u0629 \u0627\u0644\u0638\u0627\u0641\u0631": "CAI-NASR-2",
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u0645\u062F\u064A\u0646\u0629 \u0646\u0635\u0631 - \u0627\u0644\u062D\u064A \u0627\u0644\u0633\u0627\u062F\u0633": "CAI-NASR-2",
  // ✅ نفس شارع الخليفة الظافر
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u0645\u0635\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629": "CAI-HELIOPOLIS",
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u0627\u0644\u0631\u062D\u0627\u0628": "CAI-REHAB",
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u0627\u0644\u0632\u064A\u062A\u0648\u0646": "CAI-ZEITOUN",
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u0627\u0644\u062D\u0631\u0641\u064A\u064A\u0646": "CAI-HARFEYEEN",
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u062C\u0633\u0631 \u0627\u0644\u0633\u0648\u064A\u0633": "CAI-GESR",
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u0627\u0644\u0645\u0639\u0627\u062F\u064A - \u0627\u0644\u0627\u0648\u062A\u0648\u0633\u062A\u0631\u0627\u062F": "CAI-MAADI-1",
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u0627\u0644\u0645\u0639\u0627\u062F\u064A - \u0627\u0628\u0631\u0627\u062C \u0627\u0644\u0627\u0645\u0644": "CAI-MAADI-1",
  // ✅ الاسم الفعلي في الداتابيز
  "\u0627\u0644\u0642\u0627\u0647\u0631\u0629 : \u0627\u0644\u0645\u0639\u0627\u062F\u064A - \u0634\u064A\u0644 \u0627\u0648\u062A": "CAI-MAADI-2"
};
var DISTANCES_BY_CODE = {
  // من الشيخ زايد (RAC)
  "RAC->RAU": 32,
  "RAC->RAY": 18,
  "RAC->RAF": 23,
  "RAC->RAG": 24,
  "RAC->RAO": 26,
  "RAC->RSW": 22,
  "RAC->RAT": 24,
  "RAC->RAB": 32,
  "RAC->RSL": 35,
  // من العمرانية / الهرم (RAU)
  "RAU->RAC": 32,
  "RAU->RSL": 18,
  "RAU->RAY": 9,
  "RAU->RAF": 7,
  "RAU->RAG": 7.5,
  "RAU->RAO": 14,
  "RAU->RSW": 28,
  "RAU->RAT": 45,
  "RAU->RAB": 16,
  // من فيصل مصرف اللبيني (RAY)
  "RAY->RAU": 9,
  "RAY->RSL": 18,
  "RAY->RAF": 4,
  "RAY->RAG": 19,
  "RAY->RAO": 16,
  "RAY->RSW": 18,
  "RAY->RAT": 41,
  "RAY->RAB": 19,
  "RAY->RAC": 18,
  // من فيصل أبو المحاسن (RAF)
  "RAF->RAU": 7,
  "RAF->RAY": 4,
  "RAF->RAG": 13,
  "RAF->RAO": 14,
  "RAF->RSW": 21,
  "RAF->RAT": 42,
  "RAF->RAB": 19,
  "RAF->RAC": 23,
  "RAF->RSL": 23,
  // من العجوزة (RAG)
  "RAG->RAU": 7.5,
  "RAG->RAY": 19,
  "RAG->RAF": 13,
  "RAG->RAO": 6,
  "RAG->RSW": 30,
  "RAG->RAT": 46,
  "RAG->RAB": 8,
  "RAG->RAC": 24,
  "RAG->RSL": 7,
  // من المهندسين / سودان (RAO)
  "RAO->RAU": 14,
  "RAO->RAY": 16,
  "RAO->RAF": 14,
  "RAO->RAG": 6,
  "RAO->RSW": 32,
  "RAO->RAT": 42,
  "RAO->RAB": 6,
  "RAO->RAC": 26,
  "RAO->RSL": 5,
  // من أكتوبر وطنية / الواحات (RSW)
  "RSW->RAU": 28,
  "RSW->RAY": 18,
  "RSW->RAF": 21,
  "RSW->RAG": 29,
  "RSW->RAO": 32,
  "RSW->RAT": 24,
  "RSW->RAB": 36,
  "RSW->RAC": 22,
  "RSW->RSL": 35,
  // من طيبة جراند مول (RAT)
  "RAT->RAU": 45,
  "RAT->RAY": 41,
  "RAT->RAF": 42,
  "RAT->RAG": 46,
  "RAT->RAO": 42,
  "RAT->RSW": 24,
  "RAT->RAB": 42,
  "RAT->RAC": 24,
  "RAT->RSL": 46,
  // من إمبابة (RAB)
  "RAB->RAU": 16,
  "RAB->RAY": 19,
  "RAB->RAF": 19,
  "RAB->RAG": 8,
  "RAB->RAO": 6,
  "RAB->RSW": 36,
  "RAB->RAT": 42,
  "RAB->RAC": 32,
  "RAB->RSL": 9,
  // من المهندسين - أوتوبارتس ميجا ستور (RAL) — نفس منطقة المهندسين/سودان
  // المسافات مقاسة من نفس النقطة تقريباً لأن RAO و RAL في نفس الشارع
  "RAL->RAU": 14,
  "RAL->RAY": 16,
  "RAL->RAF": 14,
  "RAL->RAG": 6,
  "RAL->RSW": 32,
  "RAL->RAT": 42,
  "RAL->RAB": 6,
  "RAL->RAC": 26,
  "RAL->RSL": 5,
  "RAL->RAO": 1,
  "RAL->RAW": 41,
  "RAL->RAS": 9,
  "RAL->RAH": 48,
  "RAL->RAK": 17,
  "RAL->RBK": 16,
  // إليه (من الفروع التانية)
  "RAU->RAL": 14,
  "RAY->RAL": 16,
  "RAF->RAL": 14,
  "RAG->RAL": 6,
  "RSW->RAL": 32,
  "RAT->RAL": 42,
  "RAB->RAL": 6,
  "RAC->RAL": 26,
  "RSL->RAL": 5,
  "RAO->RAL": 1,
  "RAW->RAL": 41,
  "RAS->RAL": 9,
  "RAH->RAL": 48,
  "RAK->RAL": 17,
  "RBK->RAL": 16,
  // من أرض اللواء / RSL (Ard El Lewa — كود قديم في الشيت)
  "RSL->RAU": 18,
  "RSL->RAY": 18,
  "RSL->RAF": 23,
  "RSL->RAG": 7,
  "RSL->RAO": 5,
  "RSL->RSW": 35,
  "RSL->RAT": 46,
  "RSL->RAB": 9,
  "RSL->RAC": 35,
  // من مدينة نصر - الحي العاشر (RAW)
  "RAW->RAU": 28,
  "RAW->RAY": 33,
  "RAW->RAF": 39,
  "RAW->RAG": 26,
  "RAW->RSW": 46,
  "RAW->RAT": 64,
  "RAW->RAB": 27,
  "RAW->RAC": 46,
  "RAW->RSL": 37,
  "RAW->RAO": 41,
  "RAW->RAI": 8,
  "RAW->RAS": 16,
  "RAW->RAH": 41,
  "RAW->RAD": 19,
  "RAW->RAK": 17,
  "RAW->RBK": 19,
  // من مدينة نصر - الحي السادس (RAI)
  "RAI->RAW": 8,
  "RAI->RSL": 26,
  "RAI->RAT": 69,
  // من المعادي شيل أوت (RBK)
  "RBK->RAU": 12,
  "RBK->RAY": 17,
  "RBK->RAF": 19,
  "RBK->RAG": 16,
  "RBK->RSW": 32,
  "RBK->RAB": 23,
  "RBK->RAW": 19,
  // من جسر السويس / أحمد سعيد (RAS)
  "RAS->RAU": 14,
  "RAS->RAF": 19,
  "RAS->RAB": 9,
  "RAS->RAT": 54,
  "RAS->RAW": 16,
  // من حلوان (RAH)
  "RAH->RAU": 48,
  "RAH->RAY": 43,
  "RAH->RAF": 41,
  "RAH->RAG": 32,
  "RAH->RAO": 48,
  "RAH->RSW": 45,
  "RAH->RAB": 46,
  "RAH->RSL": 51,
  "RAH->RAT": 53,
  "RAH->RAW": 41,
  // من معروف / وسط البلد (RAD — Marouf)
  "RAD->RAW": 19,
  // من مدينة نصر المعادي صقر قريش (RAK)
  // القاهرة
  "CAI-DT-MAAROUF->CAI-DT-TAWFIQIA": 0.6,
  "CAI-DT-TAWFIQIA->CAI-DT-MAAROUF": 0.6,
  "CAI-DT-MAAROUF->CAI-SHUBRA": 8.7,
  "CAI-SHUBRA->CAI-DT-MAAROUF": 8.7,
  "CAI-DT-MAAROUF->CAI-HADAIQ": 11.2,
  "CAI-HADAIQ->CAI-DT-MAAROUF": 11.2,
  "CAI-DT-MAAROUF->CAI-AINSHAMS": 18,
  "CAI-AINSHAMS->CAI-DT-MAAROUF": 18,
  "CAI-DT-MAAROUF->CAI-MATARIA": 15.1,
  "CAI-MATARIA->CAI-DT-MAAROUF": 15.1,
  "CAI-DT-MAAROUF->CAI-ABBASIYA": 8.4,
  "CAI-ABBASIYA->CAI-DT-MAAROUF": 8.4,
  "CAI-DT-MAAROUF->CAI-HELWAN": 28.5,
  "CAI-HELWAN->CAI-DT-MAAROUF": 28.5,
  "CAI-DT-MAAROUF->CAI-NASR-1": 15.8,
  "CAI-NASR-1->CAI-DT-MAAROUF": 15.8,
  "CAI-DT-MAAROUF->CAI-NASR-2": 13.1,
  "CAI-NASR-2->CAI-DT-MAAROUF": 13.1,
  "CAI-DT-MAAROUF->CAI-HELIOPOLIS": 13.6,
  "CAI-HELIOPOLIS->CAI-DT-MAAROUF": 13.6,
  "CAI-DT-MAAROUF->CAI-REHAB": 32.5,
  "CAI-REHAB->CAI-DT-MAAROUF": 32.5,
  "CAI-DT-MAAROUF->CAI-ZEITOUN": 11.1,
  "CAI-ZEITOUN->CAI-DT-MAAROUF": 11.1,
  "CAI-DT-MAAROUF->CAI-HARFEYEEN": 18.5,
  "CAI-HARFEYEEN->CAI-DT-MAAROUF": 18.5,
  "CAI-DT-MAAROUF->CAI-GESR": 18.8,
  "CAI-GESR->CAI-DT-MAAROUF": 18.8,
  "CAI-DT-MAAROUF->CAI-MAADI-1": 11.7,
  "CAI-MAADI-1->CAI-DT-MAAROUF": 11.7,
  "CAI-DT-MAAROUF->CAI-MAADI-2": 12,
  "CAI-MAADI-2->CAI-DT-MAAROUF": 12,
  "CAI-DT-TAWFIQIA->CAI-SHUBRA": 8.1,
  "CAI-SHUBRA->CAI-DT-TAWFIQIA": 8.1,
  "CAI-DT-TAWFIQIA->CAI-HADAIQ": 10.7,
  "CAI-HADAIQ->CAI-DT-TAWFIQIA": 10.7,
  "CAI-DT-TAWFIQIA->CAI-AINSHAMS": 17.5,
  "CAI-AINSHAMS->CAI-DT-TAWFIQIA": 17.5,
  "CAI-DT-TAWFIQIA->CAI-MATARIA": 14.6,
  "CAI-MATARIA->CAI-DT-TAWFIQIA": 14.6,
  "CAI-DT-TAWFIQIA->CAI-ABBASIYA": 7.9,
  "CAI-ABBASIYA->CAI-DT-TAWFIQIA": 7.9,
  "CAI-DT-TAWFIQIA->CAI-HELWAN": 28.8,
  "CAI-HELWAN->CAI-DT-TAWFIQIA": 28.8,
  "CAI-DT-TAWFIQIA->CAI-NASR-1": 15.3,
  "CAI-NASR-1->CAI-DT-TAWFIQIA": 15.3,
  "CAI-DT-TAWFIQIA->CAI-NASR-2": 12.6,
  "CAI-NASR-2->CAI-DT-TAWFIQIA": 12.6,
  "CAI-DT-TAWFIQIA->CAI-HELIOPOLIS": 13.1,
  "CAI-HELIOPOLIS->CAI-DT-TAWFIQIA": 13.1,
  "CAI-DT-TAWFIQIA->CAI-REHAB": 32,
  "CAI-REHAB->CAI-DT-TAWFIQIA": 32,
  "CAI-DT-TAWFIQIA->CAI-ZEITOUN": 10.6,
  "CAI-ZEITOUN->CAI-DT-TAWFIQIA": 10.6,
  "CAI-DT-TAWFIQIA->CAI-HARFEYEEN": 18,
  "CAI-HARFEYEEN->CAI-DT-TAWFIQIA": 18,
  "CAI-DT-TAWFIQIA->CAI-GESR": 18.3,
  "CAI-GESR->CAI-DT-TAWFIQIA": 18.3,
  "CAI-DT-TAWFIQIA->CAI-MAADI-1": 12.1,
  "CAI-MAADI-1->CAI-DT-TAWFIQIA": 12.1,
  "CAI-DT-TAWFIQIA->CAI-MAADI-2": 12.5,
  "CAI-MAADI-2->CAI-DT-TAWFIQIA": 12.5,
  "CAI-SHUBRA->CAI-HADAIQ": 6.3,
  "CAI-HADAIQ->CAI-SHUBRA": 6.3,
  "CAI-SHUBRA->CAI-AINSHAMS": 12.6,
  "CAI-AINSHAMS->CAI-SHUBRA": 12.6,
  "CAI-SHUBRA->CAI-MATARIA": 9.7,
  "CAI-MATARIA->CAI-SHUBRA": 9.7,
  "CAI-SHUBRA->CAI-ABBASIYA": 6.1,
  "CAI-ABBASIYA->CAI-SHUBRA": 6.1,
  "CAI-SHUBRA->CAI-HELWAN": 35.5,
  "CAI-HELWAN->CAI-SHUBRA": 35.5,
  "CAI-SHUBRA->CAI-NASR-1": 14.1,
  "CAI-NASR-1->CAI-SHUBRA": 14.1,
  "CAI-SHUBRA->CAI-NASR-2": 12.6,
  "CAI-NASR-2->CAI-SHUBRA": 12.6,
  "CAI-SHUBRA->CAI-HELIOPOLIS": 10.6,
  "CAI-HELIOPOLIS->CAI-SHUBRA": 10.6,
  "CAI-SHUBRA->CAI-REHAB": 31.8,
  "CAI-REHAB->CAI-SHUBRA": 31.8,
  "CAI-SHUBRA->CAI-ZEITOUN": 7.7,
  "CAI-ZEITOUN->CAI-SHUBRA": 7.7,
  "CAI-SHUBRA->CAI-HARFEYEEN": 19.3,
  "CAI-HARFEYEEN->CAI-SHUBRA": 19.3,
  "CAI-SHUBRA->CAI-GESR": 14.6,
  "CAI-GESR->CAI-SHUBRA": 14.6,
  "CAI-SHUBRA->CAI-MAADI-1": 19.5,
  "CAI-MAADI-1->CAI-SHUBRA": 19.5,
  "CAI-SHUBRA->CAI-MAADI-2": 20.2,
  "CAI-MAADI-2->CAI-SHUBRA": 20.2,
  "CAI-HADAIQ->CAI-AINSHAMS": 7.3,
  "CAI-AINSHAMS->CAI-HADAIQ": 7.3,
  "CAI-HADAIQ->CAI-MATARIA": 4.6,
  "CAI-MATARIA->CAI-HADAIQ": 4.6,
  "CAI-HADAIQ->CAI-ABBASIYA": 3.6,
  "CAI-ABBASIYA->CAI-HADAIQ": 3.6,
  "CAI-HADAIQ->CAI-HELWAN": 33.7,
  "CAI-HELWAN->CAI-HADAIQ": 33.7,
  "CAI-HADAIQ->CAI-NASR-1": 9,
  "CAI-NASR-1->CAI-HADAIQ": 9,
  "CAI-HADAIQ->CAI-NASR-2": 9.3,
  "CAI-NASR-2->CAI-HADAIQ": 9.3,
  "CAI-HADAIQ->CAI-HELIOPOLIS": 6.3,
  "CAI-HELIOPOLIS->CAI-HADAIQ": 6.3,
  "CAI-HADAIQ->CAI-REHAB": 27.2,
  "CAI-REHAB->CAI-HADAIQ": 27.2,
  "CAI-HADAIQ->CAI-ZEITOUN": 3.4,
  "CAI-ZEITOUN->CAI-HADAIQ": 3.4,
  "CAI-HADAIQ->CAI-HARFEYEEN": 15.6,
  "CAI-HARFEYEEN->CAI-HADAIQ": 15.6,
  "CAI-HADAIQ->CAI-GESR": 9.9,
  "CAI-GESR->CAI-HADAIQ": 9.9,
  "CAI-HADAIQ->CAI-MAADI-1": 16.9,
  "CAI-MAADI-1->CAI-HADAIQ": 16.9,
  "CAI-HADAIQ->CAI-MAADI-2": 17.8,
  "CAI-MAADI-2->CAI-HADAIQ": 17.8,
  "CAI-AINSHAMS->CAI-MATARIA": 2.5,
  "CAI-MATARIA->CAI-AINSHAMS": 2.5,
  "CAI-AINSHAMS->CAI-ABBASIYA": 8.7,
  "CAI-ABBASIYA->CAI-AINSHAMS": 8.7,
  "CAI-AINSHAMS->CAI-HELWAN": 36.1,
  "CAI-HELWAN->CAI-AINSHAMS": 36.1,
  "CAI-AINSHAMS->CAI-NASR-1": 8.3,
  "CAI-NASR-1->CAI-AINSHAMS": 8.3,
  "CAI-AINSHAMS->CAI-NASR-2": 10.3,
  "CAI-NASR-2->CAI-AINSHAMS": 10.3,
  "CAI-AINSHAMS->CAI-HELIOPOLIS": 5.2,
  "CAI-HELIOPOLIS->CAI-AINSHAMS": 5.2,
  "CAI-AINSHAMS->CAI-REHAB": 22.2,
  "CAI-REHAB->CAI-AINSHAMS": 22.2,
  "CAI-AINSHAMS->CAI-ZEITOUN": 5.8,
  "CAI-ZEITOUN->CAI-AINSHAMS": 5.8,
  "CAI-AINSHAMS->CAI-HARFEYEEN": 14.8,
  "CAI-HARFEYEEN->CAI-AINSHAMS": 14.8,
  "CAI-AINSHAMS->CAI-GESR": 5.2,
  "CAI-GESR->CAI-AINSHAMS": 5.2,
  "CAI-AINSHAMS->CAI-MAADI-1": 23.4,
  "CAI-MAADI-1->CAI-AINSHAMS": 23.4,
  "CAI-AINSHAMS->CAI-MAADI-2": 24.5,
  "CAI-MAADI-2->CAI-AINSHAMS": 24.5,
  "CAI-MATARIA->CAI-ABBASIYA": 7.4,
  "CAI-ABBASIYA->CAI-MATARIA": 7.4,
  "CAI-MATARIA->CAI-HELWAN": 39.6,
  "CAI-HELWAN->CAI-MATARIA": 39.6,
  "CAI-MATARIA->CAI-NASR-1": 8.7,
  "CAI-NASR-1->CAI-MATARIA": 8.7,
  "CAI-MATARIA->CAI-NASR-2": 10.3,
  "CAI-NASR-2->CAI-MATARIA": 10.3,
  "CAI-MATARIA->CAI-HELIOPOLIS": 5.5,
  "CAI-HELIOPOLIS->CAI-MATARIA": 5.5,
  "CAI-MATARIA->CAI-REHAB": 24.1,
  "CAI-REHAB->CAI-MATARIA": 24.1,
  "CAI-MATARIA->CAI-ZEITOUN": 4.4,
  "CAI-ZEITOUN->CAI-MATARIA": 4.4,
  "CAI-MATARIA->CAI-HARFEYEEN": 15.4,
  "CAI-HARFEYEEN->CAI-MATARIA": 15.4,
  "CAI-MATARIA->CAI-GESR": 6.6,
  "CAI-GESR->CAI-MATARIA": 6.6,
  "CAI-MATARIA->CAI-MAADI-1": 22.4,
  "CAI-MAADI-1->CAI-MATARIA": 22.4,
  "CAI-MATARIA->CAI-MAADI-2": 23.4,
  "CAI-MAADI-2->CAI-MATARIA": 23.4,
  "CAI-ABBASIYA->CAI-HELWAN": 33.5,
  "CAI-HELWAN->CAI-ABBASIYA": 33.5,
  "CAI-ABBASIYA->CAI-NASR-1": 7.2,
  "CAI-NASR-1->CAI-ABBASIYA": 7.2,
  "CAI-ABBASIYA->CAI-NASR-2": 6.6,
  "CAI-NASR-2->CAI-ABBASIYA": 6.6,
  "CAI-ABBASIYA->CAI-HELIOPOLIS": 5.5,
  "CAI-HELIOPOLIS->CAI-ABBASIYA": 5.5,
  "CAI-ABBASIYA->CAI-REHAB": 25.9,
  "CAI-REHAB->CAI-ABBASIYA": 25.9,
  "CAI-ABBASIYA->CAI-ZEITOUN": 3.4,
  "CAI-ZEITOUN->CAI-ABBASIYA": 3.4,
  "CAI-ABBASIYA->CAI-HARFEYEEN": 13.6,
  "CAI-HARFEYEEN->CAI-ABBASIYA": 13.6,
  "CAI-ABBASIYA->CAI-GESR": 9.8,
  "CAI-GESR->CAI-ABBASIYA": 9.8,
  "CAI-ABBASIYA->CAI-MAADI-1": 15.6,
  "CAI-MAADI-1->CAI-ABBASIYA": 15.6,
  "CAI-ABBASIYA->CAI-MAADI-2": 16.5,
  "CAI-MAADI-2->CAI-ABBASIYA": 16.5,
  "CAI-HELWAN->CAI-NASR-1": 31.5,
  "CAI-NASR-1->CAI-HELWAN": 31.5,
  "CAI-HELWAN->CAI-NASR-2": 29.4,
  "CAI-NASR-2->CAI-HELWAN": 29.4,
  "CAI-HELWAN->CAI-HELIOPOLIS": 34.3,
  "CAI-HELIOPOLIS->CAI-HELWAN": 34.3,
  "CAI-HELWAN->CAI-REHAB": 36.1,
  "CAI-REHAB->CAI-HELWAN": 36.1,
  "CAI-HELWAN->CAI-ZEITOUN": 35.3,
  "CAI-ZEITOUN->CAI-HELWAN": 35.3,
  "CAI-HELWAN->CAI-HARFEYEEN": 27.2,
  "CAI-HARFEYEEN->CAI-HELWAN": 27.2,
  "CAI-HELWAN->CAI-GESR": 36.3,
  "CAI-GESR->CAI-HELWAN": 36.3,
  "CAI-HELWAN->CAI-MAADI-1": 18.4,
  "CAI-MAADI-1->CAI-HELWAN": 18.4,
  "CAI-HELWAN->CAI-MAADI-2": 18,
  "CAI-MAADI-2->CAI-HELWAN": 18,
  "CAI-NASR-1->CAI-NASR-2": 2.6,
  "CAI-NASR-2->CAI-NASR-1": 2.6,
  "CAI-NASR-1->CAI-HELIOPOLIS": 3.2,
  "CAI-HELIOPOLIS->CAI-NASR-1": 3.2,
  "CAI-NASR-1->CAI-REHAB": 18.8,
  "CAI-REHAB->CAI-NASR-1": 18.8,
  "CAI-NASR-1->CAI-ZEITOUN": 5.7,
  "CAI-ZEITOUN->CAI-NASR-1": 5.7,
  "CAI-NASR-1->CAI-HARFEYEEN": 7,
  "CAI-HARFEYEEN->CAI-NASR-1": 7,
  "CAI-NASR-1->CAI-GESR": 5.1,
  "CAI-GESR->CAI-NASR-1": 5.1,
  "CAI-NASR-1->CAI-MAADI-1": 15.8,
  "CAI-MAADI-1->CAI-NASR-1": 15.8,
  "CAI-NASR-1->CAI-MAADI-2": 17,
  "CAI-MAADI-2->CAI-NASR-1": 17,
  "CAI-NASR-2->CAI-HELIOPOLIS": 4.9,
  "CAI-HELIOPOLIS->CAI-NASR-2": 4.9,
  "CAI-NASR-2->CAI-REHAB": 20.3,
  "CAI-REHAB->CAI-NASR-2": 20.3,
  "CAI-NASR-2->CAI-ZEITOUN": 6.5,
  "CAI-ZEITOUN->CAI-NASR-2": 6.5,
  "CAI-NASR-2->CAI-HARFEYEEN": 7.1,
  "CAI-HARFEYEEN->CAI-NASR-2": 7.1,
  "CAI-NASR-2->CAI-GESR": 7.8,
  "CAI-GESR->CAI-NASR-2": 7.8,
  "CAI-NASR-2->CAI-MAADI-1": 13.1,
  "CAI-MAADI-1->CAI-NASR-2": 13.1,
  "CAI-NASR-2->CAI-MAADI-2": 14.4,
  "CAI-MAADI-2->CAI-NASR-2": 14.4,
  "CAI-HELIOPOLIS->CAI-REHAB": 20.8,
  "CAI-REHAB->CAI-HELIOPOLIS": 20.8,
  "CAI-HELIOPOLIS->CAI-ZEITOUN": 2.9,
  "CAI-ZEITOUN->CAI-HELIOPOLIS": 2.9,
  "CAI-HELIOPOLIS->CAI-HARFEYEEN": 10.1,
  "CAI-HARFEYEEN->CAI-HELIOPOLIS": 10.1,
  "CAI-HELIOPOLIS->CAI-GESR": 4.3,
  "CAI-GESR->CAI-HELIOPOLIS": 4.3,
  "CAI-HELIOPOLIS->CAI-MAADI-1": 17.7,
  "CAI-MAADI-1->CAI-HELIOPOLIS": 17.7,
  "CAI-HELIOPOLIS->CAI-MAADI-2": 18.9,
  "CAI-MAADI-2->CAI-HELIOPOLIS": 18.9,
  "CAI-REHAB->CAI-ZEITOUN": 23.6,
  "CAI-ZEITOUN->CAI-REHAB": 23.6,
  "CAI-REHAB->CAI-HARFEYEEN": 14.3,
  "CAI-HARFEYEEN->CAI-REHAB": 14.3,
  "CAI-REHAB->CAI-GESR": 17.5,
  "CAI-GESR->CAI-REHAB": 17.5,
  "CAI-REHAB->CAI-MAADI-1": 28.8,
  "CAI-MAADI-1->CAI-REHAB": 28.8,
  "CAI-REHAB->CAI-MAADI-2": 30.2,
  "CAI-MAADI-2->CAI-REHAB": 30.2,
  "CAI-ZEITOUN->CAI-HARFEYEEN": 12.7,
  "CAI-HARFEYEEN->CAI-ZEITOUN": 12.7,
  "CAI-ZEITOUN->CAI-GESR": 6.7,
  "CAI-GESR->CAI-ZEITOUN": 6.7,
  "CAI-ZEITOUN->CAI-MAADI-1": 18,
  "CAI-MAADI-1->CAI-ZEITOUN": 18,
  "CAI-ZEITOUN->CAI-MAADI-2": 19,
  "CAI-MAADI-2->CAI-ZEITOUN": 19,
  "CAI-HARFEYEEN->CAI-GESR": 9.9,
  "CAI-GESR->CAI-HARFEYEEN": 9.9,
  "CAI-HARFEYEEN->CAI-MAADI-1": 15.1,
  "CAI-MAADI-1->CAI-HARFEYEEN": 15.1,
  "CAI-HARFEYEEN->CAI-MAADI-2": 16.5,
  "CAI-MAADI-2->CAI-HARFEYEEN": 16.5,
  "CAI-GESR->CAI-MAADI-1": 20.9,
  "CAI-MAADI-1->CAI-GESR": 20.9,
  "CAI-GESR->CAI-MAADI-2": 22.2,
  "CAI-MAADI-2->CAI-GESR": 22.2,
  "CAI-MAADI-1->CAI-MAADI-2": 1.4,
  "CAI-MAADI-2->CAI-MAADI-1": 1.4
};
function getBranchDistance(fromBranchName, toBranchName) {
  const fromCode = BRANCH_NAME_TO_CODE[fromBranchName.trim()];
  const toCode = BRANCH_NAME_TO_CODE[toBranchName.trim()];
  if (fromCode && toCode) {
    const key = `${fromCode}->${toCode}`;
    if (DISTANCES_BY_CODE[key] !== void 0) return DISTANCES_BY_CODE[key];
  }
  const fromNorm = fromBranchName.trim().toLowerCase();
  const toNorm = toBranchName.trim().toLowerCase();
  let bestFromCode = null;
  let bestToCode = null;
  for (const [name, code] of Object.entries(BRANCH_NAME_TO_CODE)) {
    const norm = name.toLowerCase();
    if (!bestFromCode && (norm.includes(fromNorm) || fromNorm.includes(norm))) bestFromCode = code;
    if (!bestToCode && (norm.includes(toNorm) || toNorm.includes(norm))) bestToCode = code;
    if (bestFromCode && bestToCode) break;
  }
  if (bestFromCode && bestToCode) {
    const key = `${bestFromCode}->${bestToCode}`;
    if (DISTANCES_BY_CODE[key] !== void 0) return DISTANCES_BY_CODE[key];
  }
  return null;
}

// server/visits/distance.ts
async function calcDistanceFromPrevBranch(db, managerId, currentBranchName, currentLat, currentLng, referenceTime) {
  const dayStart = new Date(referenceTime);
  dayStart.setHours(0, 0, 0, 0);
  const prevVisits = await db.select({
    branchName: branches.name,
    latitude: branches.latitude,
    longitude: branches.longitude,
    latitudeIn: visits.latitudeIn,
    // ✅ موقع دخول المأمورية الخارجية (Fallback)
    longitudeIn: visits.longitudeIn,
    checkInAt: visits.checkInAt,
    checkOutAt: visits.checkOutAt
  }).from(visits).leftJoin(branches, eq4(visits.branchId, branches.id)).where(and2(
    eq4(visits.managerId, managerId),
    eq4(visits.status, "checked_out"),
    gte2(visits.checkInAt, dayStart),
    lt2(visits.checkInAt, referenceTime)
    // قبل الزيارة الحالية فقط
  )).orderBy(desc2(visits.checkInAt)).limit(1);
  if (!prevVisits[0]?.checkOutAt) return null;
  const prev = prevVisits[0];
  const prevBranchName = prev.branchName ?? "\u0645\u0623\u0645\u0648\u0631\u064A\u0629 \u062E\u0627\u0631\u062C\u064A\u0629";
  let km = prev.branchName ? getBranchDistance(prev.branchName, currentBranchName) : null;
  let estimated = false;
  if (km === null && currentLat !== void 0 && currentLng !== void 0) {
    const prevLat = prev.latitude ? parseFloat(prev.latitude) : prev.latitudeIn ? parseFloat(prev.latitudeIn) : void 0;
    const prevLng = prev.longitude ? parseFloat(prev.longitude) : prev.longitudeIn ? parseFloat(prev.longitudeIn) : void 0;
    if (prevLat !== void 0 && prevLng !== void 0) {
      const meters = getDistanceMeters(
        prevLat,
        prevLng,
        currentLat,
        currentLng
      );
      km = Math.round(meters / 100) / 10;
      estimated = true;
    }
  }
  if (km === null) {
    console.warn(`[Distances] No distance source for: "${prevBranchName}" \u2192 "${currentBranchName}"`);
    return null;
  }
  const timeDiffMin = (referenceTime.getTime() - prev.checkOutAt.getTime()) / 6e4;
  return { km, prevBranchName, timeDiffMin, estimated };
}
function isTeleportation(km, timeDiffMin) {
  if (timeDiffMin <= 0) return true;
  const speedKmh = km / (timeDiffMin / 60);
  return speedKmh > 80;
}
async function checkTravelFromPrevBranch(db, managerId, destBranchName, destLat, destLng, referenceTime) {
  const prevResult = await calcDistanceFromPrevBranch(
    db,
    managerId,
    destBranchName,
    destLat,
    destLng,
    referenceTime
  );
  if (prevResult === null) {
    return { isTeleporting: false, teleportReason: null, km: null, timeDiffMin: null, estimated: false };
  }
  const { km, prevBranchName, timeDiffMin, estimated } = prevResult;
  const teleporting = isTeleportation(km, timeDiffMin);
  const speedKmh = Math.round(km / (timeDiffMin / 60));
  const teleportReason = teleporting ? `TELEPORTATION:${prevBranchName}\u2192${destBranchName}:${km.toFixed(1)}km:${Math.round(timeDiffMin)}min:${speedKmh}kmh` : null;
  return { isTeleporting: teleporting, teleportReason, km, timeDiffMin, estimated };
}

// server/visits/checkout.ts
init_schema();
import { eq as eq5, and as and3 } from "drizzle-orm";
async function finalizeCheckOut(db, managerId, visit, checkOutTime, isAutoCheckout = false) {
  const durationMin = (checkOutTime.getTime() - visit.checkInAt.getTime()) / 6e4;
  let distanceKm;
  let isTeleporting = false;
  let distanceEstimated = false;
  if (visit.branchName) {
    const travel = await checkTravelFromPrevBranch(
      db,
      managerId,
      visit.branchName,
      visit.branchLatitude ? parseFloat(visit.branchLatitude) : void 0,
      visit.branchLongitude ? parseFloat(visit.branchLongitude) : void 0,
      visit.checkInAt
    );
    if (travel.km !== null) {
      distanceKm = travel.km;
      distanceEstimated = travel.estimated;
      if (travel.isTeleporting) {
        isTeleporting = true;
      }
    }
  }
  const existingScore = visit.suspicionScore ?? 0;
  const existingReasons = (() => {
    try {
      return JSON.parse(visit.mockReasons ?? "[]");
    } catch {
      return [];
    }
  })();
  const newReasons = [...existingReasons];
  if (distanceEstimated) newReasons.push("DIST_HAVERSINE_ESTIMATE");
  let shortVisitScore = 0;
  if (durationMin < 3) {
    shortVisitScore = 80;
    newReasons.push(`SHORT_VISIT:${Math.round(durationMin * 60)}sec`);
  } else if (durationMin < 7) {
    shortVisitScore = 40;
    newReasons.push(`SHORT_VISIT:${Math.round(durationMin)}min`);
  }
  const finalScore = existingScore + shortVisitScore;
  const reasonsChanged = JSON.stringify(newReasons) !== JSON.stringify(existingReasons);
  const isShortMocked = shortVisitScore >= 80;
  const mockedUpdate = isTeleporting || isShortMocked ? { isMocked: "yes" } : {};
  await db.update(visits).set({
    checkOutAt: checkOutTime,
    status: "checked_out",
    ...mockedUpdate,
    ...distanceKm !== void 0 ? { distanceToPrevBranchKm: distanceKm.toString() } : {},
    ...reasonsChanged ? {
      suspicionScore: finalScore,
      mockReasons: JSON.stringify(newReasons)
    } : {},
    // ── إذا كان الخروج تلقائياً (geofence) → اضبط التقييم كـ معلق ──────────────
    // سيُعرض للمدير إشعار ليُكمل تقرير الزيارة لاحقاً
    ...isAutoCheckout ? { checklistPending: "yes" } : {}
  }).where(and3(
    eq5(visits.id, visit.id),
    eq5(visits.managerId, managerId),
    eq5(visits.status, "checked_in")
    // ✅ حارس: ميتكتبش على زيارة متقفلة خلاص (idempotency)
  ));
  return {
    durationMin,
    distanceKm: distanceKm ?? null,
    isTeleporting,
    distanceEstimated
  };
}

// server/visits/notifications.ts
init_schema();
init_notification();
import { eq as eq6, inArray as inArray2 } from "drizzle-orm";
async function getManagerName(db, userId) {
  const rows = await db.select({ name: users.name }).from(users).where(eq6(users.id, userId)).limit(1);
  return rows[0]?.name ?? "\u0645\u062F\u064A\u0631 \u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641";
}
function notifyMockedCheckIn(managerName, locationName, isTeleporting) {
  notifyOwner({
    title: "\u{1F6A8} \u0632\u064A\u0627\u0631\u0629 \u0648\u0647\u0645\u064A\u0629 \u0645\u0643\u062A\u0634\u0641\u0629",
    content: `\u0627\u0644\u0645\u062F\u064A\u0631: ${managerName}
\u0627\u0644\u0645\u0643\u0627\u0646: ${locationName}
\u0627\u0644\u0648\u0642\u062A: ${(/* @__PURE__ */ new Date()).toLocaleString("ar-EG")}
${isTeleporting ? "\u062A\u0645 \u0627\u0643\u062A\u0634\u0627\u0641 \u0627\u0646\u062A\u0642\u0627\u0644 \u063A\u064A\u0631 \u0645\u0646\u0637\u0642\u064A (Teleportation)" : "\u062A\u062D\u062F\u064A\u062F \u0645\u0648\u0642\u0639 \u0648\u0647\u0645\u064A"}`
  }).catch(() => {
  });
}
function notifyMockedCheckInOffline(managerName, branchName, checkInTime, isTeleporting) {
  notifyOwner({
    title: "\u{1F6A8} \u0632\u064A\u0627\u0631\u0629 \u0648\u0647\u0645\u064A\u0629 \u0645\u0643\u062A\u0634\u0641\u0629 (\u0623\u0648\u0641\u0644\u0627\u064A\u0646)",
    content: `\u0627\u0644\u0645\u062F\u064A\u0631: ${managerName}
\u0627\u0644\u0641\u0631\u0639: ${branchName}
\u0648\u0642\u062A \u0627\u0644\u062F\u062E\u0648\u0644: ${checkInTime.toLocaleString("ar-EG")}
${isTeleporting ? "\u062A\u0645 \u0627\u0643\u062A\u0634\u0627\u0641 \u0627\u0646\u062A\u0642\u0627\u0644 \u063A\u064A\u0631 \u0645\u0646\u0637\u0642\u064A (Teleportation)" : "\u062A\u062D\u062F\u064A\u062F \u0645\u0648\u0642\u0639 \u0648\u0647\u0645\u064A"}`
  }).catch(() => {
  });
}
function notifyTeleportation(managerName, branchName, distanceKm, when) {
  notifyOwner({
    title: "\u{1F6A8} \u0627\u0646\u062A\u0642\u0627\u0644 \u0648\u0647\u0645\u064A \u0645\u0643\u062A\u0634\u0641 (Teleportation)",
    content: `\u0627\u0644\u0645\u062F\u064A\u0631: ${managerName}
\u0627\u0644\u0641\u0631\u0639: ${branchName}
\u0627\u0644\u0645\u0633\u0627\u0641\u0629: ${distanceKm?.toFixed(1) ?? "?"} \u0643\u0645
\u0627\u0644\u0648\u0642\u062A: ${when.toLocaleString("ar-EG")}`
  }).catch(() => {
  });
}
function notifyShortVisit(managerName, branchName, durationMin, when) {
  notifyOwner({
    title: "\u{1F6A8} \u0632\u064A\u0627\u0631\u0629 \u0642\u0635\u064A\u0631\u0629 \u0645\u0634\u0628\u0648\u0647\u0629",
    content: `\u0627\u0644\u0645\u062F\u064A\u0631: ${managerName}
\u0627\u0644\u0641\u0631\u0639: ${branchName}
\u0645\u062F\u0629 \u0627\u0644\u0632\u064A\u0627\u0631\u0629: ${Math.round(durationMin * 60)} \u062B\u0627\u0646\u064A\u0629 \u0641\u0642\u0637
\u0627\u0644\u0648\u0642\u062A: ${when.toLocaleString("ar-EG")}`
  }).catch(() => {
  });
}
var RESEND_FROM = "onboarding@resend.dev";
async function sendExternalMissionEmail(db, managerName, notes, lat, lng, accuracy, when) {
  const adminUsers = await db.select({ email: users.email, name: users.name }).from(users).where(inArray2(users.role, ["admin", "superadmin"]));
  const adminEmails = adminUsers.map((u) => u.email).filter((e) => !!e && e.length > 0);
  if (adminEmails.length === 0) return;
  const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Cairo',Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6d28d9,#4f46e5);padding:28px 32px;">
      <div style="font-size:28px;margin-bottom:8px;">\u{1F9ED}</div>
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">\u0645\u0623\u0645\u0648\u0631\u064A\u0629 \u062E\u0627\u0631\u062C\u064A\u0629 \u062C\u062F\u064A\u062F\u0629 \u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u0645\u0631\u0627\u062C\u0639\u062A\u0643</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">${when.toLocaleString("ar-EG")}</p>
    </div>
    <!-- Body -->
    <div style="padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">\u0627\u0633\u0645 \u0627\u0644\u0645\u062F\u064A\u0631</td><td style="padding:6px 0;font-size:13px;font-weight:600;">${managerName}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">\u0627\u0644\u0633\u0628\u0628 / \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A</td><td style="padding:6px 0;font-size:13px;">${notes || "\u2014"}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">\u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A</td><td style="padding:6px 0;font-size:13px;font-family:monospace;">${lat.toFixed(5)}, ${lng.toFixed(5)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">\u062F\u0642\u0629 GPS</td><td style="padding:6px 0;font-size:13px;">${accuracy ?? "\u2014"} \u0645</td></tr>
      </table>
      <!-- Map Button -->
      <div style="margin-top:20px;text-align:center;">
        <a href="${mapsLink}" target="_blank"
           style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700;">
          \u{1F4CD} \u0641\u062A\u062D \u0627\u0644\u0645\u0648\u0642\u0639 \u0639\u0644\u0649 \u0627\u0644\u062E\u0631\u064A\u0637\u0629
        </a>
      </div>
      <p style="margin-top:20px;color:#6b7280;font-size:12px;text-align:center;">
        \u0631\u0627\u062C\u0639 \u0627\u0644\u0645\u0623\u0645\u0648\u0631\u064A\u0629 \u0645\u0646 \u0644\u0648\u062D\u0629 \u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0632\u064A\u0627\u0631\u0627\u062A \u0648\u0642\u0645 \u0628\u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u2705 \u0623\u0648 \u0627\u0644\u0631\u0641\u0636 \u274C
      </p>
    </div>
  </div>
</body>
</html>`;
  await Promise.allSettled(
    adminEmails.map(async (email) => {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: RESEND_FROM,
            to: [email],
            subject: `\u{1F9ED} \u0645\u0623\u0645\u0648\u0631\u064A\u0629 \u062E\u0627\u0631\u062C\u064A\u0629 \u062C\u062F\u064A\u062F\u0629 \u2014 ${managerName}`,
            html
          })
        });
        if (!response.ok) {
          const errorData = await response.text();
          console.error(`[Resend] Failed to send email to ${email}. Status: ${response.status}, Error: ${errorData}`);
        }
      } catch (err) {
        console.error(`[Resend] Exception sending email to ${email}:`, err);
      }
    })
  );
}
function notifyExternalMissionPending(db, managerName, notes, lat, lng, accuracy, when) {
  notifyOwner({
    title: "\u{1F9ED} \u0645\u0623\u0645\u0648\u0631\u064A\u0629 \u062E\u0627\u0631\u062C\u064A\u0629 \u062C\u062F\u064A\u062F\u0629 \u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629",
    content: `\u0627\u0644\u0645\u062F\u064A\u0631: ${managerName}
\u0627\u0644\u063A\u0631\u0636/\u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A: ${notes || "\u2014"}
\u0627\u0644\u0625\u062D\u062F\u0627\u062B\u064A\u0627\u062A: ${lat.toFixed(5)}, ${lng.toFixed(5)}
\u0627\u0644\u062F\u0642\u0629: ${accuracy || "\u2014"}
\u0627\u0644\u062E\u0631\u064A\u0637\u0629: https://maps.google.com/?q=${lat},${lng}
\u0627\u0644\u0648\u0642\u062A: ${when.toLocaleString("ar-EG")}
\u0631\u0627\u062C\u0639\u0647\u0627 \u0645\u0646 \u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0632\u064A\u0627\u0631\u0627\u062A: \u0645\u0648\u0627\u0641\u0642\u0629 \u2705 \u0623\u0648 \u0631\u0641\u0636 \u274C`
  }).catch(() => {
  });
  sendExternalMissionEmail(db, managerName, notes, lat, lng, accuracy, when).catch((err) => console.error("[Resend] sendExternalMissionEmail failed:", err));
}

// server/visitRouter.ts
var activeCheckInLocks = /* @__PURE__ */ new Set();
var coordSchema = z4.string().regex(/^-?\d{1,3}(\.\d+)?$/, "invalid coordinate");
var visitHistorySelection = {
  id: visits.id,
  checkInAt: visits.checkInAt,
  checkOutAt: visits.checkOutAt,
  status: visits.status,
  photoUrl: visits.photoUrl,
  notes: visits.notes,
  latitudeIn: visits.latitudeIn,
  longitudeIn: visits.longitudeIn,
  distanceToPrevBranchKm: visits.distanceToPrevBranchKm,
  isMocked: visits.isMocked,
  visitType: visits.visitType,
  noteType: visits.noteType,
  missionLatitude: visits.missionLatitude,
  missionLongitude: visits.missionLongitude,
  missionRadiusMeters: visits.missionRadiusMeters,
  // ✅ حالة اعتماد المأمورية — المدير يشوفها في سجل الزيارات وعلى الداشبورد
  approvalStatus: visits.approvalStatus,
  branchName: branches.name,
  branchId: branches.id,
  branchCode: branches.code,
  branchAddress: branches.address
};
var visitRouter = router({
  // POST — manager checks in to a branch or external mission
  checkIn: protectedProcedure.input(z4.object({
    branchId: z4.number().int().positive().optional(),
    visitType: z4.enum(["branch", "external_mission"]).default("branch"),
    noteType: z4.enum(["general", "short_visit", "non_primary", "external_mission"]).default("general"),
    latitude: coordSchema,
    longitude: coordSchema,
    accuracy: z4.string().max(32).optional(),
    // ── نطاق المأمورية الخارجية التلقائي (اختياري) ─────────────────────────
    missionLatitude: coordSchema.optional(),
    missionLongitude: coordSchema.optional(),
    missionRadiusMeters: z4.number().int().min(20).max(1e4).optional(),
    photoBase64: z4.string().max(6e6).optional(),
    notes: z4.string().max(1e3).optional(),
    isMocked: z4.boolean().optional(),
    // explicit flag: the request comes from the user-initiated manual check-in button
    manual: z4.boolean().optional(),
    suspicionScore: z4.number().int().min(0).max(1e4).optional(),
    mockReasons: z4.array(z4.string().max(200)).max(20).optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const managerRows = await db.select({ manager: managers, checkinMode: users.checkinMode }).from(managers).innerJoin(users, eq7(managers.userId, users.id)).where(eq7(managers.userId, ctx.user.id)).limit(1);
    if (!managerRows[0]) throw new Error("Manager profile not found");
    const manager = managerRows[0].manager;
    if (activeCheckInLocks.has(manager.id)) {
      throw new Error("Already processing a check-in request, please wait.");
    }
    activeCheckInLocks.add(manager.id);
    try {
      const existingVisits = await db.select({ id: visits.id }).from(visits).where(and4(eq7(visits.managerId, manager.id), eq7(visits.status, "checked_in"))).limit(1);
      if (existingVisits.length > 0) throw new Error("Already checked into a branch. Please check out first.");
      if (managerRows[0].checkinMode === "manual" && input.visitType === "branch" && !input.manual) {
        throw new Error("MANUAL_MODE_BLOCKED");
      }
      let branch;
      if (input.visitType === "branch" || input.branchId) {
        if (!input.branchId) throw new Error("Branch ID is required for a branch visit.");
        const branchResult = await db.select().from(branches).where(eq7(branches.id, input.branchId)).limit(1);
        if (!branchResult[0]) throw new Error("Branch not found");
        const currentBranch = branchResult[0];
        branch = currentBranch;
        const dist = getDistanceMeters(
          parseFloat(input.latitude),
          parseFloat(input.longitude),
          parseFloat(currentBranch.latitude),
          parseFloat(currentBranch.longitude)
        );
        if (dist > (currentBranch.geofenceRadiusMeters || 200) + 50) throw new Error("You are too far from the branch to check in.");
      }
      let photoUrl;
      if (input.photoBase64) {
        const buffer = Buffer.from(input.photoBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");
        const stored = await storagePut(`visits/${manager.id}_${Date.now()}.jpg`, buffer, "image/jpeg");
        photoUrl = stored.url;
      }
      let isTeleporting = false;
      const teleportReasons = [];
      if (branch) {
        const travel = await checkTravelFromPrevBranch(
          db,
          manager.id,
          branch.name,
          parseFloat(branch.latitude),
          parseFloat(branch.longitude),
          /* @__PURE__ */ new Date()
        );
        if (travel.isTeleporting) {
          isTeleporting = true;
          teleportReasons.push(travel.teleportReason);
        }
      } else if (input.visitType === "external_mission") {
        const travel = await checkTravelFromPrevBranch(
          db,
          manager.id,
          "\u0645\u0623\u0645\u0648\u0631\u064A\u0629 \u062E\u0627\u0631\u062C\u064A\u0629",
          parseFloat(input.latitude),
          parseFloat(input.longitude),
          /* @__PURE__ */ new Date()
        );
        if (travel.isTeleporting) {
          isTeleporting = true;
          teleportReasons.push(travel.teleportReason);
        }
      }
      let missionDistanceToPrevKm;
      if (input.visitType === "external_mission") {
        const travelForDist = await checkTravelFromPrevBranch(
          db,
          manager.id,
          "\u0645\u0623\u0645\u0648\u0631\u064A\u0629 \u062E\u0627\u0631\u062C\u064A\u0629",
          parseFloat(input.latitude),
          parseFloat(input.longitude),
          /* @__PURE__ */ new Date()
        );
        if (travelForDist.km !== null) {
          missionDistanceToPrevKm = travelForDist.km.toFixed(2);
        }
      }
      const finalIsMocked = input.isMocked || isTeleporting;
      const combinedReasons = [...input.mockReasons || [], ...teleportReasons];
      const finalReasons = combinedReasons.length > 0 ? JSON.stringify(combinedReasons) : null;
      const finalScore = (input.suspicionScore || 0) + (isTeleporting ? 100 : 0);
      await db.update(managers).set({ isActive: "yes" }).where(eq7(managers.id, manager.id));
      await db.insert(visits).values({
        managerId: manager.id,
        branchId: input.branchId,
        visitType: input.visitType,
        noteType: input.noteType,
        latitudeIn: input.latitude,
        longitudeIn: input.longitude,
        accuracyIn: input.accuracy,
        photoUrl,
        notes: input.notes,
        status: "checked_in",
        isMocked: finalIsMocked ? "yes" : "no",
        suspicionScore: finalScore,
        mockReasons: finalReasons,
        // ✅ مسافة المأمورية من الزيارة السابقة (محسوبة وقت checkIn)
        ...missionDistanceToPrevKm !== void 0 ? { distanceToPrevBranchKm: missionDistanceToPrevKm } : {},
        // ── مركز المأمورية للجيوفنس التلقائي — يُخزن للمأمورية الخارجية فقط ──
        ...input.visitType === "external_mission" ? {
          missionLatitude: input.missionLatitude ?? input.latitude,
          missionLongitude: input.missionLongitude ?? input.longitude,
          missionRadiusMeters: input.missionRadiusMeters ?? 200,
          // المأمورية الخارجية تتسجل بانتظار المراجعة — الفروع تبقى approved من الـ default
          approvalStatus: "pending",
          // ✅ تم إزالة أقرب فرع بناءً على طلب المستخدم
          nearestBranchId: null,
          nearestBranchName: null,
          nearestBranchDistanceKm: null
        } : {}
      });
      if (input.visitType === "external_mission") {
        const managerName = await getManagerName(db, ctx.user.id);
        notifyExternalMissionPending(
          db,
          managerName,
          input.notes,
          parseFloat(input.latitude),
          parseFloat(input.longitude),
          input.accuracy,
          /* @__PURE__ */ new Date()
        );
      }
      if (finalIsMocked) {
        const managerName = await getManagerName(db, ctx.user.id);
        notifyMockedCheckIn(managerName, branch ? branch.name : "\u0645\u0623\u0645\u0648\u0631\u064A\u0629 \u062E\u0627\u0631\u062C\u064A\u0629", isTeleporting);
      }
      return { success: true };
    } finally {
      activeCheckInLocks.delete(manager.id);
    }
  }),
  // POST — Android native background service checkout (accepts branchId, looks up the active visitId itself)
  // Used by NativeGeofenceEngine.java which only knows the branchId, not the visitId
  nativeCheckOut: protectedProcedure.input(z4.object({ branchId: z4.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const managerRows = await db.select({ manager: managers, checkinMode: users.checkinMode }).from(managers).innerJoin(users, eq7(managers.userId, users.id)).where(eq7(managers.userId, ctx.user.id)).limit(1);
    if (!managerRows[0]) throw new Error("Manager profile not found");
    const manager = managerRows[0].manager;
    if (managerRows[0].checkinMode === "manual") {
      throw new Error("MANUAL_MODE_BLOCKED");
    }
    const activeVisit = await db.select({
      id: visits.id,
      checkInAt: visits.checkInAt,
      branchName: branches.name,
      branchLatitude: branches.latitude,
      branchLongitude: branches.longitude,
      // ✅ جايين مع الـ select الأصلي — finalizeCheckOut مش محتاجة استعلام إضافي
      suspicionScore: visits.suspicionScore,
      mockReasons: visits.mockReasons
    }).from(visits).innerJoin(branches, eq7(visits.branchId, branches.id)).where(and4(
      eq7(visits.managerId, manager.id),
      eq7(visits.branchId, input.branchId),
      eq7(visits.status, "checked_in")
    )).limit(1);
    if (!activeVisit[0]) {
      return { success: true, skipped: true };
    }
    const result = await finalizeCheckOut(db, manager.id, activeVisit[0], /* @__PURE__ */ new Date(), true);
    return {
      success: true,
      skipped: false,
      durationMin: Math.round(result.durationMin),
      distanceRecorded: result.distanceKm,
      // ✅ نُبلغ الكلاينت أن التقييم معلق عشان يعرض إشعاراً
      checklistPending: true
    };
  }),
  // POST — manager checks out
  checkOut: protectedProcedure.input(z4.object({
    visitId: z4.number().int().positive(),
    notes: z4.string().max(1e3).optional(),
    noteType: z4.enum(["general", "short_visit", "non_primary", "external_mission"]).optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const managerResult = await db.select().from(managers).where(eq7(managers.userId, ctx.user.id)).limit(1);
    if (!managerResult[0]) throw new Error("Manager profile not found");
    const manager = managerResult[0];
    const visitResult = await db.select({
      id: visits.id,
      checkInAt: visits.checkInAt,
      notes: visits.notes,
      branchName: branches.name,
      branchLatitude: branches.latitude,
      branchLongitude: branches.longitude,
      // ✅ جايين مع الـ select الأصلي — finalizeCheckOut مش محتاجة استعلام إضافي
      suspicionScore: visits.suspicionScore,
      mockReasons: visits.mockReasons
    }).from(visits).leftJoin(branches, eq7(visits.branchId, branches.id)).where(and4(
      eq7(visits.id, input.visitId),
      eq7(visits.managerId, manager.id),
      eq7(visits.status, "checked_in")
    )).limit(1);
    if (!visitResult[0]) throw new Error("Visit not found or already checked out.");
    const now = /* @__PURE__ */ new Date();
    const visit = visitResult[0];
    const result = await finalizeCheckOut(db, manager.id, visit, now);
    if (input.notes || input.noteType) {
      const finalNotes = input.notes ? visit.notes ? `${visit.notes}
---
\u062E\u0631\u0648\u062C: ${input.notes}` : input.notes : visit.notes;
      await db.update(visits).set({
        ...input.noteType ? { noteType: input.noteType } : {},
        ...input.notes ? { notes: finalNotes } : {}
      }).where(eq7(visits.id, visit.id));
    }
    if (result.isTeleporting) {
      const managerName = await getManagerName(db, ctx.user.id);
      notifyTeleportation(managerName, visit.branchName, result.distanceKm, now);
    }
    const isShortMocked = result.durationMin < 3;
    if (isShortMocked) {
      const managerName = await getManagerName(db, ctx.user.id);
      notifyShortVisit(managerName, visit.branchName, result.durationMin, now);
    }
    return {
      success: true,
      durationMin: Math.round(result.durationMin),
      distanceRecorded: result.distanceKm
    };
  }),
  // GET — current manager's visit history
  myHistory: protectedProcedure.input(z4.object({
    limit: z4.number().int().min(1).max(500).default(50),
    offset: z4.number().int().min(0).default(0)
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const managerResult = await db.select().from(managers).where(eq7(managers.userId, ctx.user.id)).limit(1);
    if (!managerResult[0]) return { items: [], total: 0, activeCount: 0, doneCount: 0 };
    const managerId = managerResult[0].id;
    const whereClause = and4(
      eq7(visits.managerId, managerId)
    );
    const [{ total, activeCount, doneCount }] = await db.select({
      total: count(),
      activeCount: sql2`count(case when ${visits.status} = 'checked_in' then 1 end)`.mapWith(Number),
      doneCount: sql2`count(case when ${visits.status} = 'checked_out' then 1 end)`.mapWith(Number)
    }).from(visits).where(whereClause);
    const items = await db.select(visitHistorySelection).from(visits).leftJoin(branches, eq7(visits.branchId, branches.id)).where(whereClause).orderBy(desc3(visits.checkInAt)).limit(input.limit).offset(input.offset);
    return { items, total, activeCount, doneCount };
  }),
  // GET — الزيارة النشطة الحالية للمدير (بنفس شكل عنصر myHistory) أو null
  // خفيفة: idx_visits_manager_status + limit 1 — بديل أخف لـ myHistory{limit:5} في شاشة تسجيل الدخول
  getActive: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const managerResult = await db.select({ id: managers.id }).from(managers).where(eq7(managers.userId, ctx.user.id)).limit(1);
    if (!managerResult[0]) return null;
    const items = await db.select(visitHistorySelection).from(visits).leftJoin(branches, eq7(visits.branchId, branches.id)).where(and4(
      eq7(visits.managerId, managerResult[0].id),
      eq7(visits.status, "checked_in"),
      // ✅ المأمورية المرفوضة لا تظهر كزيارة نشطة للمدير (فقط من getActive)
      or2(ne2(visits.visitType, "external_mission"), ne2(visits.approvalStatus, "rejected"))
    )).orderBy(desc3(visits.checkInAt)).limit(1);
    return items[0] ?? null;
  }),
  // GET — admin: all visits with filters
  adminList: adminProcedure.input(z4.object({
    managerId: z4.number().int().positive().optional(),
    branchId: z4.number().int().positive().optional(),
    startDate: z4.string().max(32).optional(),
    endDate: z4.string().max(32).optional(),
    approvalStatus: z4.enum(["pending", "approved", "rejected"]).optional(),
    limit: z4.number().int().min(1).max(1e3).default(100),
    offset: z4.number().int().min(0).default(0)
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const conditions = [];
    if (input.managerId) conditions.push(eq7(visits.managerId, input.managerId));
    if (input.branchId) conditions.push(eq7(visits.branchId, input.branchId));
    if (input.startDate) conditions.push(gte3(visits.checkInAt, new Date(input.startDate)));
    if (input.endDate) {
      const end = new Date(input.endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(visits.checkInAt, end));
    }
    if (input.approvalStatus) conditions.push(eq7(visits.approvalStatus, input.approvalStatus));
    const whereClause = conditions.length > 0 ? and4(...conditions) : void 0;
    const [{ total }] = await db.select({ total: count() }).from(visits).innerJoin(managers, eq7(visits.managerId, managers.id)).innerJoin(users, eq7(managers.userId, users.id)).where(whereClause);
    const items = await db.select({
      id: visits.id,
      checkInAt: visits.checkInAt,
      checkOutAt: visits.checkOutAt,
      status: visits.status,
      photoUrl: visits.photoUrl,
      notes: visits.notes,
      distanceToPrevBranchKm: visits.distanceToPrevBranchKm,
      isMocked: visits.isMocked,
      // ✅ أسباب التلاعب — تظهر فقط للأدمن في التقارير
      mockReasons: visits.mockReasons,
      visitType: visits.visitType,
      noteType: visits.noteType,
      // ── حقول المأمورية الخارجية — إضافة للعرض في تقارير الأدمن ─────────────
      latitudeIn: visits.latitudeIn,
      longitudeIn: visits.longitudeIn,
      missionLatitude: visits.missionLatitude,
      missionLongitude: visits.missionLongitude,
      missionRadiusMeters: visits.missionRadiusMeters,
      nearestBranchId: visits.nearestBranchId,
      nearestBranchName: visits.nearestBranchName,
      nearestBranchDistanceKm: visits.nearestBranchDistanceKm,
      // ── حالة اعتماد المأمورية — للـ badge وأزرار الموافقة/الرفض في تقارير الأدمن ──
      approvalStatus: visits.approvalStatus,
      reviewedAt: visits.reviewedAt,
      branchName: branches.name,
      branchId: branches.id,
      branchCode: branches.code,
      managerName: users.name,
      managerEmail: users.email,
      managerPhotoUrl: managers.photoUrl,
      // ✅ تقرير الزيارة الإلزامي — Checkout Checklist
      visitChecklistData: visits.visitChecklistData,
      checklistPending: visits.checklistPending
    }).from(visits).leftJoin(branches, eq7(visits.branchId, branches.id)).innerJoin(managers, eq7(visits.managerId, managers.id)).innerJoin(users, eq7(managers.userId, users.id)).where(whereClause).orderBy(desc3(visits.checkInAt)).limit(input.limit).offset(input.offset);
    return { items, total };
  }),
  // POST — admin: اعتماد أو رفض مأمورية خارجية (الرفض يغلق الزيارة النشطة لو كانت شغالة)
  reviewMission: adminProcedure.input(z4.object({
    visitId: z4.number().int().positive(),
    decision: z4.enum(["approved", "rejected"])
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(visits).set({
      approvalStatus: input.decision,
      reviewedAt: /* @__PURE__ */ new Date(),
      reviewedByUserId: ctx.user.id
    }).where(and4(eq7(visits.id, input.visitId), eq7(visits.visitType, "external_mission")));
    if (input.decision === "rejected") {
      await db.update(visits).set({
        checkOutAt: /* @__PURE__ */ new Date(),
        status: "checked_out"
      }).where(and4(eq7(visits.id, input.visitId), eq7(visits.status, "checked_in")));
    }
    return { success: true };
  }),
  // GET — admin dashboard stats
  stats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [{ totalBranches }] = await db.select({ totalBranches: count() }).from(branches).where(eq7(branches.isActive, "yes"));
    const [{ totalManagers }] = await db.select({ totalManagers: count() }).from(managers).where(eq7(managers.isActive, "yes"));
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const [{ todayVisits, mockedVisitsToday }] = await db.select({
      todayVisits: count(),
      mockedVisitsToday: sql2`count(case when ${visits.isMocked} = 'yes' then 1 end)`.mapWith(Number)
    }).from(visits).where(gte3(visits.checkInAt, today));
    return { totalBranches, totalManagers, todayVisits, mockedVisitsToday };
  }),
  // GET — recent visits for dashboard
  recentVisits: adminProcedure.input(z4.object({ limit: z4.number().int().min(1).max(50).default(5) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const items = await db.select({
      id: visits.id,
      checkInAt: visits.checkInAt,
      checkOutAt: visits.checkOutAt,
      status: visits.status,
      isMocked: visits.isMocked,
      visitType: visits.visitType,
      branchName: branches.name,
      managerName: users.name,
      managerId: managers.id
    }).from(visits).leftJoin(branches, eq7(visits.branchId, branches.id)).innerJoin(managers, eq7(visits.managerId, managers.id)).innerJoin(users, eq7(managers.userId, users.id)).orderBy(desc3(visits.checkInAt)).limit(input.limit);
    return items;
  }),
  // GET — الزيارات المفتوحة حالياً لكل مدير (للداشبورد)
  activeVisits: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const items = await db.select({
      managerId: managers.id,
      branchName: branches.name,
      visitType: visits.visitType,
      checkInAt: visits.checkInAt
    }).from(visits).leftJoin(branches, eq7(visits.branchId, branches.id)).innerJoin(managers, eq7(visits.managerId, managers.id)).where(eq7(visits.status, "checked_in"));
    return items;
  }),
  // POST — sync offline visits (check-in / check-out)
  syncOfflineVisits: protectedProcedure.input(z4.object({
    visits: z4.array(z4.discriminatedUnion("type", [
      z4.object({
        type: z4.literal("check_in"),
        branchId: z4.number().int().positive(),
        branchName: z4.string().max(255),
        latitude: coordSchema,
        longitude: coordSchema,
        accuracy: z4.string().max(32).optional(),
        checkInAt: z4.string().datetime({ offset: true }),
        localId: z4.string().max(128),
        isMocked: z4.boolean().optional()
      }),
      z4.object({
        type: z4.literal("check_out"),
        localCheckInId: z4.string().max(128),
        serverVisitId: z4.number().int().positive().optional(),
        branchName: z4.string().max(255),
        checkOutAt: z4.string().datetime({ offset: true }),
        checkInAt: z4.string().datetime({ offset: true })
      })
    ])).max(50)
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const managerResult = await db.select().from(managers).where(eq7(managers.userId, ctx.user.id)).limit(1);
    if (!managerResult[0]) throw new Error("Manager profile not found");
    const manager = managerResult[0];
    return db.transaction(async (tx) => {
      let synced = 0;
      let rejected = 0;
      const failedLocalIds = [];
      const localToServerId = /* @__PURE__ */ new Map();
      const checkIns = input.visits.filter((v) => v.type === "check_in");
      for (const ci of checkIns) {
        try {
          const existing = await tx.select({ id: visits.id }).from(visits).where(and4(eq7(visits.managerId, manager.id), eq7(visits.status, "checked_in"))).limit(1);
          if (existing.length > 0) {
            failedLocalIds.push(ci.localId);
            rejected++;
            continue;
          }
          const branchResult = await tx.select().from(branches).where(eq7(branches.id, ci.branchId)).limit(1);
          if (!branchResult[0]) {
            failedLocalIds.push(ci.localId);
            rejected++;
            continue;
          }
          const branch = branchResult[0];
          const dist = getDistanceMeters(
            parseFloat(ci.latitude),
            parseFloat(ci.longitude),
            parseFloat(branch.latitude),
            parseFloat(branch.longitude)
          );
          if (dist > (branch.geofenceRadiusMeters || 200) + 50) {
            console.warn(`[syncOfflineVisits] Rejected: manager ${manager.id} was ${Math.round(dist)}m from branch ${branch.name}`);
            failedLocalIds.push(ci.localId);
            rejected++;
            continue;
          }
          const ciReasons = [];
          let isTeleporting = false;
          const checkInTime = new Date(ci.checkInAt);
          const travel = await checkTravelFromPrevBranch(
            tx,
            manager.id,
            ci.branchName,
            parseFloat(branch.latitude),
            parseFloat(branch.longitude),
            checkInTime
          );
          if (travel.isTeleporting) {
            isTeleporting = true;
            ciReasons.push(travel.teleportReason);
          }
          const ciFinalMocked = ci.isMocked || isTeleporting;
          await tx.update(managers).set({ isActive: "yes" }).where(eq7(managers.id, manager.id));
          const inserted = await tx.insert(visits).values({
            managerId: manager.id,
            branchId: ci.branchId,
            latitudeIn: ci.latitude,
            longitudeIn: ci.longitude,
            accuracyIn: ci.accuracy,
            checkInAt: checkInTime,
            status: "checked_in",
            isMocked: ciFinalMocked ? "yes" : "no",
            suspicionScore: ciFinalMocked ? 100 : 0,
            mockReasons: ciReasons.length > 0 ? JSON.stringify(ciReasons) : null
          }).$returningId();
          if (ciFinalMocked) {
            const managerName = await getManagerName(tx, ctx.user.id);
            notifyMockedCheckInOffline(managerName, branch.name, checkInTime, isTeleporting);
          }
          localToServerId.set(ci.localId, inserted[0].id);
          synced++;
        } catch (err) {
          console.error("[syncOfflineVisits] checkIn error:", err);
          failedLocalIds.push(ci.localId);
        }
      }
      const checkOuts = input.visits.filter((v) => v.type === "check_out");
      for (const co of checkOuts) {
        try {
          const visitId = localToServerId.get(co.localCheckInId) ?? (co.serverVisitId ?? null);
          if (!visitId) {
            failedLocalIds.push(co.localCheckInId);
            continue;
          }
          const visitRow = await tx.select({
            id: visits.id,
            checkInAt: visits.checkInAt,
            branchName: branches.name,
            branchLatitude: branches.latitude,
            branchLongitude: branches.longitude,
            // ✅ جايين مع الـ select الأصلي — finalizeCheckOut مش محتاجة استعلام إضافي
            suspicionScore: visits.suspicionScore,
            mockReasons: visits.mockReasons
          }).from(visits).leftJoin(branches, eq7(visits.branchId, branches.id)).where(and4(eq7(visits.id, visitId), eq7(visits.managerId, manager.id))).limit(1);
          if (!visitRow[0]) continue;
          await finalizeCheckOut(tx, manager.id, visitRow[0], new Date(co.checkOutAt));
          synced++;
        } catch (err) {
          console.error("[syncOfflineVisits] checkOut error:", err);
        }
      }
      return { synced, rejected, failedLocalIds };
    });
  }),
  // POST — sync offline tracking data
  syncOfflineData: protectedProcedure.input(z4.object({
    locations: z4.array(z4.object({
      latitude: coordSchema,
      longitude: coordSchema,
      accuracy: z4.string().max(32).optional(),
      timestamp: z4.string().datetime({ offset: true })
    })).max(2e3)
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const managerResult = await db.select().from(managers).where(eq7(managers.userId, ctx.user.id)).limit(1);
    if (!managerResult[0]) throw new Error("Manager profile not found");
    const manager = managerResult[0];
    if (input.locations.length > 0) {
      await db.insert(locationLogs).values(input.locations.map((loc) => ({
        managerId: manager.id,
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy,
        timestamp: new Date(loc.timestamp),
        syncedAt: /* @__PURE__ */ new Date()
      })));
    }
    return { success: true, syncedLocations: input.locations.length };
  }),
  // ── 🦸‍♂️ السوبر أدمن ──────────────────────────────────────────────────────────
  superadminUpdate: superAdminProcedure.input(z4.object({
    id: z4.number(),
    managerId: z4.number().optional(),
    branchId: z4.number().nullable().optional(),
    visitType: z4.enum(["branch", "external_mission"]).optional(),
    noteType: z4.enum(["general", "short_visit", "non_primary", "external_mission"]).optional(),
    checkInAt: z4.string().optional(),
    checkOutAt: z4.string().nullable().optional(),
    notes: z4.string().nullable().optional(),
    status: z4.enum(["checked_in", "checked_out"]).optional(),
    isMocked: z4.enum(["yes", "no"]).optional(),
    distanceToPrevBranchKm: z4.number().nullable().optional()
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = input;
    const updateData = { ...data };
    if (input.checkInAt !== void 0) updateData.checkInAt = new Date(input.checkInAt);
    if (input.checkOutAt !== void 0) updateData.checkOutAt = input.checkOutAt ? new Date(input.checkOutAt) : null;
    if (input.distanceToPrevBranchKm !== void 0) updateData.distanceToPrevBranchKm = input.distanceToPrevBranchKm?.toString();
    await db.update(visits).set(updateData).where(eq7(visits.id, id));
    return { success: true };
  }),
  superadminDelete: superAdminProcedure.input(z4.object({ id: z4.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(visits).where(eq7(visits.id, input.id));
    return { success: true };
  }),
  superadminCreate: superAdminProcedure.input(z4.object({
    managerId: z4.number(),
    branchId: z4.number().nullable(),
    visitType: z4.enum(["branch", "external_mission"]),
    noteType: z4.enum(["general", "short_visit", "non_primary", "external_mission"]),
    checkInAt: z4.string(),
    checkOutAt: z4.string().nullable(),
    notes: z4.string().nullable(),
    status: z4.enum(["checked_in", "checked_out"]),
    isMocked: z4.enum(["yes", "no"]),
    latitudeIn: z4.string(),
    longitudeIn: z4.string()
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const updateData = { ...input };
    updateData.checkInAt = new Date(input.checkInAt);
    if (input.checkOutAt) updateData.checkOutAt = new Date(input.checkOutAt);
    await db.insert(visits).values(updateData);
    return { success: true };
  }),
  // ── GET — تقرير المدير الشهري (بدون أي معلومات وهمية) ─────────────────────
  // يُستخدم من صفحة تقارير المدير — نظيف تماماً من mockReasons/isMocked
  myReport: protectedProcedure.input(z4.object({
    startDate: z4.string().max(32).optional(),
    endDate: z4.string().max(32).optional(),
    limit: z4.number().int().min(1).max(1e3).default(500),
    offset: z4.number().int().min(0).default(0)
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const managerResult = await db.select().from(managers).where(eq7(managers.userId, ctx.user.id)).limit(1);
    if (!managerResult[0]) return { items: [], total: 0 };
    const managerId = managerResult[0].id;
    const conditions = [
      eq7(visits.managerId, managerId),
      // إخفاء المأموريات المرفوضة من تقرير المدير
      or2(ne2(visits.visitType, "external_mission"), ne2(visits.approvalStatus, "rejected"))
    ];
    if (input.startDate) conditions.push(gte3(visits.checkInAt, new Date(input.startDate)));
    if (input.endDate) {
      const end = new Date(input.endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(visits.checkInAt, end));
    }
    const whereClause = and4(...conditions);
    const [{ total }] = await db.select({ total: count() }).from(visits).where(whereClause);
    const items = await db.select({
      id: visits.id,
      checkInAt: visits.checkInAt,
      checkOutAt: visits.checkOutAt,
      status: visits.status,
      visitType: visits.visitType,
      noteType: visits.noteType,
      notes: visits.notes,
      distanceToPrevBranchKm: visits.distanceToPrevBranchKm,
      // لا نُرسل isMocked ولا mockReasons للمدير أبداً
      branchName: branches.name,
      branchId: branches.id,
      branchCode: branches.code,
      branchAddress: branches.address
    }).from(visits).leftJoin(branches, eq7(visits.branchId, branches.id)).where(whereClause).orderBy(desc3(visits.checkInAt)).limit(input.limit).offset(input.offset);
    return { items, total };
  }),
  // ── POST — تسليم تقييم الخروج الإلزامي (Checkout Checklist) ────────────────
  // يُستدعى بعد الخروج اليدوي أو بعد إشعار الخروج التلقائي
  // يحفظ بيانات التقييم في visitChecklistData ويُصفّي checklistPending
  submitCheckoutChecklist: protectedProcedure.input(z4.object({
    visitId: z4.number().int().positive(),
    // بيانات التقييم كـ JSON object
    uniform: z4.number().int().min(1).max(5),
    collections: z4.boolean(),
    inventoryCount: z4.boolean(),
    cleanliness: z4.number().int().min(1).max(5),
    transfers: z4.boolean(),
    transfersRating: z4.number().int().min(1).max(5).optional(),
    // فقط لو transfers=true
    shortages: z4.boolean(),
    shortageItems: z4.array(z4.string().max(200)).max(50).optional(),
    // فقط لو shortages=true
    audit: z4.boolean()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const managerResult = await db.select({ id: managers.id }).from(managers).where(eq7(managers.userId, ctx.user.id)).limit(1);
    if (!managerResult[0]) throw new Error("Manager profile not found");
    const { visitId, ...checklistData } = input;
    const visitResult = await db.select({ id: visits.id }).from(visits).where(and4(
      eq7(visits.id, visitId),
      eq7(visits.managerId, managerResult[0].id)
    )).limit(1);
    if (!visitResult[0]) throw new Error("Visit not found");
    await db.update(visits).set({
      visitChecklistData: JSON.stringify(checklistData),
      checklistPending: "no"
    }).where(eq7(visits.id, visitId));
    return { success: true };
  }),
  // ── GET — الزيارة الأخيرة التي لها تقييم معلق (checklistPending=yes) ────────
  // تُستخدم لعرض تذكير التقييم للمدير بعد الخروج التلقائي أو عند دخول فرع جديد
  getPendingChecklist: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const managerResult = await db.select({ id: managers.id }).from(managers).where(eq7(managers.userId, ctx.user.id)).limit(1);
    if (!managerResult[0]) return null;
    const result = await db.select({
      id: visits.id,
      checkInAt: visits.checkInAt,
      checkOutAt: visits.checkOutAt,
      branchName: branches.name,
      branchId: branches.id
    }).from(visits).leftJoin(branches, eq7(visits.branchId, branches.id)).where(and4(
      eq7(visits.managerId, managerResult[0].id),
      eq7(visits.checklistPending, "yes"),
      eq7(visits.status, "checked_out")
    )).orderBy(desc3(visits.checkOutAt)).limit(1);
    return result[0] ?? null;
  })
});

// server/scheduleRouter.ts
import { z as z5 } from "zod";
import { eq as eq8, and as and5 } from "drizzle-orm";
init_db();
init_schema();
import { TRPCError as TRPCError3 } from "@trpc/server";
var scheduleRouter = router({
  // GET — جدول الأسبوع الكامل للمدير الحالي
  getMySchedule: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allowedRoles = ["area_manager", "user"];
    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError3({ code: "FORBIDDEN", message: "\u0627\u0644\u062C\u062F\u0648\u0644\u0629 \u0645\u062A\u0627\u062D\u0629 \u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0641\u0642\u0637" });
    }
    const managerResult = await db.select({ id: managers.id }).from(managers).where(eq8(managers.userId, ctx.user.id)).limit(1);
    if (!managerResult[0]) return [];
    const result = await db.select({
      id: areaManagerSchedules.id,
      managerId: areaManagerSchedules.managerId,
      branchId: areaManagerSchedules.branchId,
      dayOfWeek: areaManagerSchedules.dayOfWeek,
      plannedTime: areaManagerSchedules.plannedTime,
      note: areaManagerSchedules.note,
      createdAt: areaManagerSchedules.createdAt,
      // بيانات الفرع للعرض
      branchName: branches.name,
      branchCode: branches.code,
      branchAddress: branches.address
    }).from(areaManagerSchedules).innerJoin(branches, eq8(areaManagerSchedules.branchId, branches.id)).where(eq8(areaManagerSchedules.managerId, managerResult[0].id)).orderBy(areaManagerSchedules.dayOfWeek, areaManagerSchedules.plannedTime);
    return result;
  }),
  // POST — إضافة إدخال جديد في الجدولة
  addEntry: protectedProcedure.input(z5.object({
    branchId: z5.number().int().positive(),
    dayOfWeek: z5.number().int().min(0).max(6),
    plannedTime: z5.string().regex(/^\d{2}:\d{2}$/).optional(),
    note: z5.string().max(500).optional()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allowedRoles = ["area_manager", "user"];
    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError3({ code: "FORBIDDEN", message: "\u0627\u0644\u062C\u062F\u0648\u0644\u0629 \u0645\u062A\u0627\u062D\u0629 \u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0641\u0642\u0637" });
    }
    const managerResult = await db.select({ id: managers.id }).from(managers).where(eq8(managers.userId, ctx.user.id)).limit(1);
    if (!managerResult[0]) throw new TRPCError3({ code: "NOT_FOUND", message: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A \u0644\u0644\u0645\u062F\u064A\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    const branchResult = await db.select({ id: branches.id, name: branches.name }).from(branches).where(eq8(branches.id, input.branchId)).limit(1);
    if (!branchResult[0]) throw new TRPCError3({ code: "NOT_FOUND", message: "\u0627\u0644\u0641\u0631\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    await db.insert(areaManagerSchedules).values({
      managerId: managerResult[0].id,
      branchId: input.branchId,
      dayOfWeek: input.dayOfWeek,
      plannedTime: input.plannedTime,
      note: input.note
    });
    return { success: true };
  }),
  // DELETE — حذف إدخال من الجدولة
  removeEntry: protectedProcedure.input(z5.object({ id: z5.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const managerResult = await db.select({ id: managers.id }).from(managers).where(eq8(managers.userId, ctx.user.id)).limit(1);
    if (!managerResult[0]) throw new TRPCError3({ code: "NOT_FOUND", message: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A \u0644\u0644\u0645\u062F\u064A\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    await db.delete(areaManagerSchedules).where(
      and5(
        eq8(areaManagerSchedules.id, input.id),
        eq8(areaManagerSchedules.managerId, managerResult[0].id)
      )
    );
    return { success: true };
  }),
  // PUT — تعديل ملاحظة أو وقت إدخال موجود
  updateEntry: protectedProcedure.input(z5.object({
    id: z5.number().int().positive(),
    plannedTime: z5.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
    note: z5.string().max(500).optional().nullable()
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const managerResult = await db.select({ id: managers.id }).from(managers).where(eq8(managers.userId, ctx.user.id)).limit(1);
    if (!managerResult[0]) throw new TRPCError3({ code: "NOT_FOUND", message: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A \u0644\u0644\u0645\u062F\u064A\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    const updateData = {};
    if (input.plannedTime !== void 0) updateData.plannedTime = input.plannedTime;
    if (input.note !== void 0) updateData.note = input.note;
    await db.update(areaManagerSchedules).set(updateData).where(
      and5(
        eq8(areaManagerSchedules.id, input.id),
        eq8(areaManagerSchedules.managerId, managerResult[0].id)
      )
    );
    return { success: true };
  })
});

// server/routers.ts
init_db();
import { TRPCError as TRPCError4 } from "@trpc/server";
function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash: _ph, boundDeviceId: _bd, boundWebFingerprint: _bwf, ...safe } = user;
  return safe;
}
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => sanitizeUser(opts.ctx.user)),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  users: router({
    // قائمة كل المستخدمين
    // الأدمن العادي لا يرى الـ superadmin — يتصفى في db.listUsers بناءً على دور المتصدي
    list: adminProcedure.query(async ({ ctx }) => {
      const isSuperAdmin = ctx.user?.role === "superadmin";
      const users2 = await listUsers(isSuperAdmin);
      return users2.map((u) => ({
        ...u,
        isDeviceBound: Boolean(u.boundDeviceId),
        boundDeviceId: void 0,
        isWebBound: Boolean(u.boundWebFingerprint),
        boundWebFingerprint: void 0
      }));
    }),
    // إنشاء مستخدم جديد
    create: adminProcedure.input(z6.object({
      username: z6.string().min(3).max(64),
      password: z6.string().min(6),
      name: z6.string().optional(),
      email: z6.string().email().optional(),
      // الأدمن العادي يقدر يخلق area_manager أو branch_manager فقط
      // السوبر أدمن يقدر يخلق admin كمان
      role: z6.enum(["area_manager", "branch_manager", "admin", "user"]).default("area_manager"),
      // نظام التشغيل — ios يُجبر على manual تلقائياً
      os: z6.enum(["android", "ios"]).default("android")
    })).mutation(async ({ input, ctx }) => {
      if (input.role === "admin" && ctx.user?.role !== "superadmin") {
        throw new TRPCError4({ code: "FORBIDDEN", message: "\u0641\u0642\u0637 \u0627\u0644\u0633\u0648\u0628\u0631 \u0623\u062F\u0645\u0646 \u064A\u0645\u0643\u0646\u0647 \u0625\u0646\u0634\u0627\u0621 \u0623\u062F\u0645\u0646" });
      }
      const existing = await getUserByUsername(input.username);
      if (existing) throw new TRPCError4({ code: "CONFLICT", message: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0648\u062C\u0648\u062F \u0628\u0627\u0644\u0641\u0639\u0644" });
      const passwordHash = await hashPassword(input.password);
      const checkinMode = input.os === "ios" ? "manual" : "automatic";
      await createUser({
        username: input.username,
        passwordHash,
        name: input.name ?? null,
        email: input.email ?? null,
        role: input.role,
        os: input.os,
        checkinMode,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      return { success: true };
    }),
    // تعديل مستخدم موجود
    update: adminProcedure.input(z6.object({
      id: z6.number(),
      username: z6.string().min(3).max(64).optional(),
      password: z6.string().min(6).optional(),
      name: z6.string().optional(),
      email: z6.string().email().optional().or(z6.literal("")),
      role: z6.enum(["area_manager", "branch_manager", "admin", "user"]).optional(),
      os: z6.enum(["android", "ios"]).optional()
    })).mutation(async ({ input, ctx }) => {
      const { id, password, ...rest } = input;
      const existing = await getUserById(id);
      if (!existing) throw new TRPCError4({ code: "NOT_FOUND", message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      if (ctx.user?.role !== "superadmin") {
        if (existing.role === "superadmin") throw new TRPCError4({ code: "FORBIDDEN", message: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0633\u0648\u0628\u0631 \u0623\u062F\u0645\u0646" });
        if (rest.role === "admin") throw new TRPCError4({ code: "FORBIDDEN", message: "\u0641\u0642\u0637 \u0627\u0644\u0633\u0648\u0628\u0631 \u0623\u062F\u0645\u0646 \u064A\u0645\u0643\u0646\u0647 \u0631\u0641\u0639 \u0627\u0644\u062F\u0648\u0631 \u0644\u0623\u062F\u0645\u0646" });
      }
      if (rest.username && rest.username !== existing.username) {
        const taken = await getUserByUsername(rest.username);
        if (taken) throw new TRPCError4({ code: "CONFLICT", message: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0648\u062C\u0648\u062F \u0628\u0627\u0644\u0641\u0639\u0644" });
      }
      const updateData = { ...rest };
      if (rest.email === "") updateData.email = null;
      if (password) updateData.passwordHash = await hashPassword(password);
      if (rest.os === "ios" && existing.checkinMode !== "manual") {
        updateData.checkinMode = "manual";
      }
      await updateUser(id, updateData);
      return { success: true };
    }),
    // حذف مستخدم
    delete: adminProcedure.input(z6.object({ id: z6.number() })).mutation(async ({ input, ctx }) => {
      if (ctx.user?.id === input.id)
        throw new TRPCError4({ code: "FORBIDDEN", message: "\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u062D\u0630\u0641 \u062D\u0633\u0627\u0628\u0643 \u0627\u0644\u062E\u0627\u0635" });
      const existing = await getUserById(input.id);
      if (!existing) throw new TRPCError4({ code: "NOT_FOUND", message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      await deleteUser(input.id);
      return { success: true };
    }),
    // 🔓 فك ربط جهاز مستخدم — يسمح له بتسجيل الدخول من موبايل جديد
    // (الجهاز الجديد هيتربط تلقائياً بأول تسجيل دخول بعدها)
    unbindDevice: adminProcedure.input(z6.object({ id: z6.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const existing = await getUserById(input.id);
      if (!existing) throw new TRPCError4({ code: "NOT_FOUND", message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      if (!existing.boundDeviceId) {
        throw new TRPCError4({ code: "BAD_REQUEST", message: "\u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0634 \u0645\u0631\u0628\u0648\u0637 \u0628\u062C\u0647\u0627\u0632 \u0623\u0635\u0644\u0627\u064B" });
      }
      await updateUser(input.id, { boundDeviceId: null, deviceBoundAt: null });
      console.log(`[Auth] Admin ${ctx.user?.username} unbound device for user ${existing.username}`);
      return { success: true };
    }),
    // 🔓 فك ربط متصفح الويب — يسمح للمدير بتسجيل الدخول من متصفح آيفون جديد
    // (المتصفح الجديد هيتربط تلقائياً بأول تسجيل دخول بعدها)
    unbindWebDevice: adminProcedure.input(z6.object({ id: z6.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const existing = await getUserById(input.id);
      if (!existing) throw new TRPCError4({ code: "NOT_FOUND", message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      if (!existing.boundWebFingerprint) {
        throw new TRPCError4({ code: "BAD_REQUEST", message: "\u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0634 \u0645\u0631\u0628\u0648\u0637 \u0628\u0645\u062A\u0635\u0641\u062D \u0648\u064A\u0628 \u0623\u0635\u0644\u0627\u064B" });
      }
      await updateUser(input.id, { boundWebFingerprint: null, webFingerprintAt: null });
      console.log(`[Auth] Admin ${ctx.user?.username} unbound web browser for user ${existing.username}`);
      return { success: true };
    }),
    // ??? ???? ??????? ??? ??????? (admin ??) — automatic ?? manual
    setCheckinMode: adminProcedure.input(z6.object({
      id: z6.number().int().positive(),
      mode: z6.enum(["automatic", "manual"])
    })).mutation(async ({ input, ctx }) => {
      const existing = await getUserById(input.id);
      if (!existing) throw new TRPCError4({ code: "NOT_FOUND", message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      await updateUser(input.id, { checkinMode: input.mode });
      console.log("[Auth] Admin " + (ctx.user?.username ?? "?") + " set checkinMode=" + input.mode + " for user " + existing.username);
      return { success: true, checkinMode: input.mode };
    }),
    // ── 🦸‍♂️ السوبر أدمن للتحكم الشامل في المستخدمين ────────────────────────
    superadminUpdateUser: superAdminProcedure.input(z6.object({
      id: z6.number(),
      username: z6.string().min(3).max(64).optional(),
      password: z6.string().optional(),
      name: z6.string().optional(),
      email: z6.string().email().optional().or(z6.literal("")),
      role: z6.enum(["user", "admin", "superadmin"]).optional(),
      os: z6.enum(["android", "ios"]).optional(),
      checkinMode: z6.enum(["automatic", "manual"]).optional(),
      boundDeviceId: z6.string().nullable().optional(),
      boundWebFingerprint: z6.string().nullable().optional()
    })).mutation(async ({ input }) => {
      const { id, password, ...rest } = input;
      const existing = await getUserById(id);
      if (!existing) throw new TRPCError4({ code: "NOT_FOUND", message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      if (rest.username && rest.username !== existing.username) {
        const taken = await getUserByUsername(rest.username);
        if (taken) throw new TRPCError4({ code: "CONFLICT", message: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0645\u0648\u062C\u0648\u062F \u0628\u0627\u0644\u0641\u0639\u0644" });
      }
      const updateData = { ...rest };
      if (rest.email === "") updateData.email = null;
      if (password) updateData.passwordHash = await hashPassword(password);
      if (rest.os === "ios" && !rest.checkinMode) {
        updateData.checkinMode = "manual";
      }
      await updateUser(id, updateData);
      return { success: true };
    })
  }),
  branch: branchRouter,
  manager: managerRouter,
  visit: visitRouter,
  schedule: scheduleRouter
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }
  return { req: opts.req, res: opts.res, user };
}

// server/_core/vite.ts
import express from "express";
import fs4 from "fs";
import { nanoid } from "nanoid";
import path4 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs3 from "node:fs";
import path3 from "node:path";
import { defineConfig } from "vite";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path3.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs3.existsSync(LOG_DIR)) fs3.mkdirSync(LOG_DIR, { recursive: true });
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs3.existsSync(logPath) || fs3.statSync(logPath).size <= maxSize) return;
    const lines = fs3.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > TRIM_TARGET_BYTES) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs3.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path3.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => `[${(/* @__PURE__ */ new Date()).toISOString()}] ${JSON.stringify(entry)}`);
  fs3.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginDebugCollector() {
  return {
    name: "debug-collector",
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") return next();
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            if (payload.consoleLogs?.length > 0) writeToLogFile("browserConsole", payload.consoleLogs);
            if (payload.networkRequests?.length > 0) writeToLogFile("networkRequests", payload.networkRequests);
            if (payload.sessionEvents?.length > 0) writeToLogFile("sessionReplay", payload.sessionEvents);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [
    react({
      // Use automatic JSX runtime — ensures React hooks are always available
      jsxRuntime: "automatic"
    }),
    tailwindcss(),
    vitePluginDebugCollector()
  ],
  // Do NOT exclude background-geolocation from optimizeDeps.
  // It's loaded via dynamic import at runtime — let Vite handle it normally.
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path3.resolve(import.meta.dirname),
  root: path3.resolve(import.meta.dirname, "client"),
  publicDir: path3.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Target modern browsers / Android WebView 67+
    target: ["es2020", "chrome87", "firefox78", "safari14"],
    rollupOptions: {
      // ⚠️ Do NOT mark background-geolocation as external.
      // In Android Capacitor WebView there is no module resolver,
      // so externals cause "X is not defined" runtime errors.
      // The dynamic import in useGeofence.ts handles it safely at runtime.
      output: {
        // Keep React in a stable chunk to avoid deduplication issues
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "trpc-vendor": ["@trpc/client", "@trpc/react-query", "@tanstack/react-query"],
          "ui-vendor": ["lucide-react", "sonner", "wouter"],
          // ✅ مكتبات ثقيلة بتتحمّل بس لما الصفحة المحتاجاها تفتح
          "maps-vendor": ["leaflet", "react-leaflet"],
          "charts-vendor": ["recharts"],
          "excel-vendor": ["xlsx"]
        }
      }
    }
  },
  server: {
    host: true,
    allowedHosts: ["localhost", "127.0.0.1"],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs4.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path4.resolve(import.meta.dirname, "../..", "dist", "public") : path4.resolve(import.meta.dirname, "public");
  if (!fs4.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
import cors from "cors";
function createRateLimiter({ windowMs, max }) {
  const attempts = /* @__PURE__ */ new Map();
  setInterval(() => {
    const now = Date.now();
    attempts.forEach((record, key) => {
      if (record.resetAt < now) attempts.delete(key);
    });
  }, windowMs).unref();
  return function rateLimit(req, res, next) {
    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const now = Date.now();
    let record = attempts.get(ip);
    if (!record || record.resetAt < now) {
      record = { count: 0, resetAt: now + windowMs };
      attempts.set(ip, record);
    }
    record.count++;
    if (record.count > max) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1e3);
      res.set("Retry-After", String(retryAfterSec));
      res.status(429).json({ error: `\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0643\u062A\u064A\u0631 \u062C\u062F\u0627\u064B. \u062D\u0627\u0648\u0644 \u062A\u0627\u0646\u064A \u0628\u0639\u062F ${retryAfterSec} \u062B\u0627\u0646\u064A\u0629` });
      return;
    }
    next();
  };
}
var DEFAULT_ALLOWED_ORIGINS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/.*\.ngrok-free\.app$/,
  /^capacitor:\/\/localhost$/,
  /^http:\/\/localhost$/
];
function isOriginAllowed(origin) {
  if (DEFAULT_ALLOWED_ORIGINS.some((re) => re.test(origin))) return true;
  const extra = process.env.ALLOWED_ORIGINS;
  if (!extra) return false;
  return extra.split(",").map((o) => o.trim()).filter(Boolean).some((allowed) => origin === allowed);
}
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => server.close(() => resolve(true)));
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.set("trust proxy", 1);
  app.use((_req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("X-Frame-Options", "DENY");
    res.set("Referrer-Policy", "same-origin");
    next();
  });
  app.use(cors({
    origin(origin, callback) {
      if (!origin || isOriginAllowed(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true
  }));
  app.use(express2.json({ limit: "8mb" }));
  app.use(express2.urlencoded({ limit: "8mb", extended: true }));
  const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1e3, max: 20 });
  app.use("/api/auth/login", loginLimiter);
  const uploadsDir = path5.join(process.cwd(), "uploads");
  app.use("/uploads", (req, res, next) => {
    sdk.authenticateRequest(req).then(() => next()).catch(() => res.status(401).json({ error: "Unauthorized" }));
  }, express2.static(uploadsDir));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  function setupEndOfDayJob() {
    const scheduleNext = () => {
      const now = /* @__PURE__ */ new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 1, 0);
      const delay = nextMidnight.getTime() - now.getTime();
      setTimeout(async () => {
        try {
          const dbModule = await Promise.resolve().then(() => (init_db(), db_exports));
          const db = await dbModule.getDb();
          const schema = await Promise.resolve().then(() => (init_schema(), schema_exports));
          if (db) {
            await db.update(schema.managers).set({ isActive: "no" });
            console.log("[CRON] End of day reset: all managers set to inactive");
          }
        } catch (err) {
          console.error("[CRON] Error resetting managers:", err);
        }
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }
  setupEndOfDayJob();
  const preferredPort = parseInt(process.env.PORT ?? "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) console.log(`Port ${preferredPort} busy, using ${port}`);
  server.listen(port, () => {
    console.log(`\u2705 Server running: http://localhost:${port}/`);
    console.log(`   Run "pnpm seed" to create the first admin user`);
  });
}
startServer().catch(console.error);
