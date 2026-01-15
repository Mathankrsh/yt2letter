import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Check if DATABASE_URL is available (not available at build time)
const getDatabaseUrl = () => {
  if (!process.env.DATABASE_URL) {
    // Return a dummy value during build - actual connection will fail gracefully
    return "postgresql://placeholder:placeholder@placeholder:5432/placeholder";
  }
  return process.env.DATABASE_URL;
};

const sql = neon(getDatabaseUrl());
export const db = drizzle(sql, { schema });
