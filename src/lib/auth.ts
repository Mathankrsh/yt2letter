import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";

export const auth = betterAuth({
  session: {
    expiresIn: 60 * 60 * 24 * 60, // 60 days in seconds
    updateAge: 60 * 60 * 24, // Update session expiry every 24 hours
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disabled for prototype
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [nextCookies()],
});
