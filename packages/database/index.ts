import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "./env";

console.log(env.DATABASE_URL);

export const db = drizzle(env.DATABASE_URL);
export * from "drizzle-orm";
export default db;
