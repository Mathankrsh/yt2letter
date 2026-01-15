"use server";

import { GoogleGenAI } from "@google/genai";
import { extractYouTubeData } from "./youtube";
import { getCurrentUser } from "./users";
import { db } from "@/db/drizzle";
import { newsletters } from "@/db/schema";

const SECONDS_PER_MINUTE = 60;
const MIN_NEWSLETTER_LENGTH = 300;

/**
 * Get full transcript text from captions array.
 */
function getFullTranscript(
  captions: Array<{ start: string; dur: string; text: string }>
): string {
  return captions.map((caption) => caption.text).join(" ");
}

/**
 * Create prompt for rewriting transcript into clean, structured content.
 */
function createRewritePrompt(videoData: any, captionText: string): string {
  return `You are a professional content writer. Rewrite and condense the following YouTube video transcript into clean, well-organized content.

**Video Information:**
- Title: ${videoData.title}
- Author: ${videoData.author}
- Duration: ${Math.floor(Number.parseInt(videoData.duration, 10) / SECONDS_PER_MINUTE)} minutes

**Raw Transcript:**
${captionText}

---

## YOUR TASK

Rewrite this transcript into clean, readable content that:
1. Removes filler words, repetitions, and verbal tics (um, uh, like, you know)
2. Fixes grammar and sentence structure
3. Organizes content into logical sections with clear themes
4. Preserves the original speaker's voice and key messages
5. Maintains 80-90% of the original wording where possible
6. Uses first-person perspective (I, my, me)

## OUTPUT REQUIREMENTS

- Output clean, flowing prose organized by topic
- Include section headers to organize major topics
- Keep the full depth of content - don't over-summarize
- Target length: 2,000-8,000 words depending on video length
- Do NOT add any new information not in the transcript
- Do NOT use HTML tags - output plain text with markdown headers (##)

## EXAMPLE OUTPUT FORMAT

## Introduction
The cleaned up content for the intro section...

## Topic 1: [Name]
The cleaned up content for this topic...

## Topic 2: [Name]
More cleaned content...

## Conclusion
Wrapping up the main points...

---

Now rewrite the transcript above:`;
}

/**
 * Create prompt for generating newsletter from rewritten content.
 * Using thread-style prompt as base (will be updated with dedicated newsletter prompt later).
 */
function createNewsletterPrompt(videoData: any, rewrittenContent: string): string {
  const durationMinutes = Math.floor(
    Number.parseInt(videoData.duration, 10) / SECONDS_PER_MINUTE
  );

  return `Generate an engaging email newsletter based on this YouTube video content:

**Video Information:**
- Title: ${videoData.title}
- Author: ${videoData.author}
- Duration: ${durationMinutes} minutes

**Content (cleaned transcript):**
${rewrittenContent}

---

## NEWSLETTER GENERATION RULES

**TARGET LENGTH:** 800-1500 words (optimal for email newsletters)

**CONTENT RULES:**
- Write in first person (I, my, me) as if the video creator is sharing insights
- Use 90-95% of key ideas/phrases from the content
- Personal, conversational tone that feels like a friend sharing knowledge
- Make it scannable with clear sections
- Include actionable takeaways

**STRUCTURE:**

1. **Subject Line Suggestion** - Compelling, curiosity-driven (under 50 chars)
2. **Opening Hook** (2-3 sentences) - Personal story or striking statement
3. **Main Insight** (The core value) - What the video teaches
4. **Key Takeaways** - 3-5 bullet points of actionable advice
5. **Personal Reflection** - What this means for the reader
6. **Sign Off** - Warm, personal closing

**FORMATTING RULES:**
- Use plain text (NO HTML tags)
- Use **bold** for emphasis sparingly
- Use bullet points with - or • characters
- Separate sections with blank lines
- Keep paragraphs short (2-3 sentences max)

---

## EXAMPLE OUTPUT FORMAT:

**Subject Line:** The one habit that changed everything

---

Hey there,

I just watched something that completely shifted how I think about [topic].

Most people believe [common misconception]. But here's what I learned...

[Main insight paragraphs here]

**Here's what I'm taking away from this:**

- First actionable takeaway
- Second actionable takeaway  
- Third actionable takeaway

This really made me reflect on [personal connection].

Until next time,
[Author name]

---

⚠️ IMPORTANT: Output plain text only. No HTML. No markdown code blocks. Just the newsletter content.

Now generate the newsletter:`;
}

/**
 * Step 1: Rewrite transcript into clean content.
 */
async function rewriteTranscript(
  videoData: any,
  captions: any[]
): Promise<string> {
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const fullTranscript = getFullTranscript(captions);
  const rewritePrompt = createRewritePrompt(videoData, fullTranscript);

  console.log(`📝 Rewriting transcript: ${fullTranscript.length} characters`);

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [{ role: "user", parts: [{ text: rewritePrompt }] }],
  });

  if (!result.candidates?.[0]?.content?.parts?.[0]) {
    throw new Error("Invalid response from Gemini API for transcript rewriting");
  }

  const rewrittenContent = result.candidates[0].content.parts[0].text || "";
  console.log(`✅ Rewritten content: ${rewrittenContent.length} characters`);

  return rewrittenContent;
}

/**
 * Step 2: Generate newsletter from rewritten content.
 */
async function generateNewsletterFromAI(
  videoData: any,
  rewrittenContent: string
): Promise<string> {
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const newsletterPrompt = createNewsletterPrompt(videoData, rewrittenContent);

  console.log(`📨 Generating newsletter from rewritten content...`);

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [{ role: "user", parts: [{ text: newsletterPrompt }] }],
  });

  if (!result.candidates?.[0]?.content?.parts?.[0]) {
    throw new Error("Invalid response from Gemini API for newsletter generation");
  }

  const newsletterContent = result.candidates[0].content.parts[0].text || "";

  if (!newsletterContent || newsletterContent.length < MIN_NEWSLETTER_LENGTH) {
    throw new Error(
      `Generated newsletter is too short: ${newsletterContent?.length || 0} characters`
    );
  }

  console.log(`✅ Newsletter generated: ${newsletterContent.length} characters`);

  return newsletterContent;
}

/**
 * Main function: Generate newsletter from YouTube URL.
 */
export async function generateNewsletter(youtubeUrl: string) {
  try {
    // Verify user is authenticated
    const { user } = await getCurrentUser();

    // Extract YouTube video data
    console.log("Step 0: Extracting YouTube data...");
    const videoData = await extractYouTubeData(youtubeUrl);

    if (!videoData.captions || videoData.captions.length === 0) {
      throw new Error(
        "No captions available for this video. The video must have captions to generate a newsletter."
      );
    }

    // Step 1: Rewrite transcript into clean content
    console.log("Step 1: Rewriting transcript...");
    const rewrittenContent = await rewriteTranscript(
      videoData,
      videoData.captions
    );
    console.log("Rewrite complete:", rewrittenContent.length, "characters");

    // Step 2: Generate newsletter from rewritten content
    console.log("Step 2: Generating newsletter...");
    const newsletterContent = await generateNewsletterFromAI(
      videoData,
      rewrittenContent
    );
    console.log("Newsletter generation complete");

    // Step 3: Save to database
    console.log("Step 3: Saving to database...");
    const [newsletter] = await db
      .insert(newsletters)
      .values({
        userId: user.id,
        videoId: videoData.slug,
        videoTitle: videoData.title,
        videoAuthor: videoData.author,
        content: newsletterContent,
      })
      .returning();

    console.log("✅ Newsletter saved with ID:", newsletter.id);

    return {
      id: newsletter.id,
      videoTitle: videoData.title,
      videoAuthor: videoData.author,
      content: newsletterContent,
    };
  } catch (error) {
    console.error("❌ Newsletter generation failed:", error);
    throw new Error(
      `Failed to generate newsletter: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
