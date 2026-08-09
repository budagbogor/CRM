import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be defined in .env");
  }

  console.log("Menghubungkan ke Sumobase PostgreSQL...");
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  console.log("Terhubung ke Sumobase!");

  const sqlPath = path.join(process.cwd(), "prisma", "schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  console.log("Menjalankan eksekusi skema database (tables, indexes, constraints)...");
  await client.query(sql);
  console.log("Skema database berhasil dibuat di Sumobase!");

  await client.end();
}

main().catch((err) => {
  console.error("Gagal menjalankan migrasi:", err);
  process.exit(1);
});
