import "dotenv/config";
import mysql from "mysql2/promise";
import * as fs from "fs";
import * as path from "path";

const BACKUP_DIR = path.resolve("backups/db-backup-2026-09-01T13-37-52");

function toMySQLDatetime(val: string): string {
  return val.replace("T", " ").replace(/\.\d{3}Z$/, "");
}

function isISODate(val: unknown): boolean {
  return typeof val === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(val);
}

async function restore() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const connection = await mysql.createConnection(url);

  const tables = [
    "users",
    "branches",
    "managers",
    "managerBranches",
    "visits",
    "locationLogs",
  ];

  await connection.execute("SET FOREIGN_KEY_CHECKS = 0");

  for (const table of tables) {
    const filePath = path.join(BACKUP_DIR, `${table}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${table}.json not found, skipping`);
      continue;
    }

    const rows: any[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (rows.length === 0) {
      console.log(`⏭️  ${table}: empty, skipping`);
      continue;
    }

    await connection.execute(`DELETE FROM \`${table}\``);

    const columns = Object.keys(rows[0]);
    const colList = columns.map((c) => `\`${c}\``).join(", ");
    const placeholder = `(${columns.map(() => "?").join(", ")})`;

    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const placeholders = batch.map(() => placeholder).join(", ");
      const values = batch.flatMap((row) =>
        columns.map((col) => {
          const v = row[col];
          if (v === null || v === undefined) return null;
          if (isISODate(v)) return toMySQLDatetime(v);
          return v;
        })
      );

      await connection.execute(
        `INSERT INTO \`${table}\` (${colList}) VALUES ${placeholders}`,
        values
      );

      if (i % 500 === 0 && i > 0) {
        process.stdout.write(`  ${table}: ${i}/${rows.length}\r`);
      }
    }

    console.log(`✅ ${table}: ${rows.length} rows restored`);
  }

  await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
  console.log("\n🎉 Restore complete!");
  await connection.end();
  process.exit(0);
}

restore().catch((err) => {
  console.error("❌ Restore failed:", err);
  process.exit(1);
});
