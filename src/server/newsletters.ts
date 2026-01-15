"use server";

import { db } from "@/db/drizzle";
import { newsletters } from "@/db/schema";
import { getCurrentUser } from "./users";
import { eq, desc } from "drizzle-orm";

export type NewsletterItem = {
  id: number;
  videoId: string;
  videoTitle: string;
  videoAuthor: string;
  content: string;
  createdAt: Date;
};

/**
 * Fetch all newsletters for the current user.
 */
export async function getUserNewsletters(): Promise<NewsletterItem[]> {
  const { user } = await getCurrentUser();

  const userNewsletters = await db
    .select({
      id: newsletters.id,
      videoId: newsletters.videoId,
      videoTitle: newsletters.videoTitle,
      videoAuthor: newsletters.videoAuthor,
      content: newsletters.content,
      createdAt: newsletters.createdAt,
    })
    .from(newsletters)
    .where(eq(newsletters.userId, user.id))
    .orderBy(desc(newsletters.createdAt));

  return userNewsletters;
}

/**
 * Fetch a single newsletter by ID for the current user.
 */
export async function getNewsletterById(id: number): Promise<NewsletterItem | null> {
  const { user } = await getCurrentUser();

  const [newsletter] = await db
    .select({
      id: newsletters.id,
      videoId: newsletters.videoId,
      videoTitle: newsletters.videoTitle,
      videoAuthor: newsletters.videoAuthor,
      content: newsletters.content,
      createdAt: newsletters.createdAt,
    })
    .from(newsletters)
    .where(eq(newsletters.id, id))
    .limit(1);

  if (!newsletter) {
    return null;
  }

  // Verify ownership
  const [ownerCheck] = await db
    .select({ userId: newsletters.userId })
    .from(newsletters)
    .where(eq(newsletters.id, id))
    .limit(1);

  if (ownerCheck?.userId !== user.id) {
    return null;
  }

  return newsletter;
}

/**
 * Delete a newsletter by ID.
 */
export async function deleteNewsletter(id: number): Promise<boolean> {
  const { user } = await getCurrentUser();

  // Verify ownership first
  const [newsletter] = await db
    .select({ userId: newsletters.userId })
    .from(newsletters)
    .where(eq(newsletters.id, id))
    .limit(1);

  if (!newsletter || newsletter.userId !== user.id) {
    return false;
  }

  await db.delete(newsletters).where(eq(newsletters.id, id));
  return true;
}
