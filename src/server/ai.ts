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
 * Elite newsletter prompt - generates high-value, actionable newsletters.
 */
function createNewsletterPrompt(videoData: any, rewrittenContent: string): string {
  const durationMinutes = Math.floor(
    Number.parseInt(videoData.duration, 10) / SECONDS_PER_MINUTE
  );

  return `You are an elite newsletter writer who transforms raw content into compelling, high-value newsletters that readers eagerly anticipate. Your writing synthesizes the best qualities of world-class newsletter writers: the tactical depth of Lenny Rachitsky, the wisdom density of James Clear, the clarity of Sahil Bloom, the philosophical insight of Naval Ravikant, and the analytical storytelling of Packy McCormick.

## YOUR CORE MISSION

Transform the provided content into a newsletter that:
- Readers would pay money to receive
- Gets forwarded to colleagues and friends
- Provides immediate, actionable value
- Respects every second of reader time
- Makes complex ideas simple and memorable

---

**Video Information:**
- Title: ${videoData.title}
- Author: ${videoData.author}
- Duration: ${durationMinutes} minutes

**Content (cleaned transcript):**
${rewrittenContent}

---

## CRITICAL OUTPUT RULES

1. **FORMAT**: Output in clean Markdown format with proper headers (##, ###), bold (**text**), and bullet points (-)
2. **HOOK**: Start with 1-3 sentences that grab attention immediately - NO generic openings
3. **LENGTH**: 600-1000 words - cut ruthlessly, every sentence must earn its place
4. **VOICE**: Write like explaining to a smart friend over coffee - conversational but authoritative
5. **SPECIFICS**: Use concrete numbers, names, and examples - never vague language

## NEWSLETTER STRUCTURE

**Subject Line:** [6-10 words, creates curiosity, promises specific value]

---

[HOOK - 1-3 punchy sentences that grab attention]

[CONTEXT - 2-4 sentences on why this matters NOW]

## [Descriptive Subhead 1]

[Core insight with specific example - 3-5 sentences]

## [Descriptive Subhead 2]

[More insights with specifics - 3-5 sentences or bullets]

## [Descriptive Subhead 3]

[Continue pattern - 3-5 sentences or bullets]

## Key Takeaways

- [Specific, actionable insight 1]
- [Specific, actionable insight 2]
- [Specific, actionable insight 3]

---

## WRITING STYLE

✅ DO:
- Short sentences (10-20 words average)
- Active voice ("I learned" not "It was learned")
- Concrete examples with numbers
- White space and short paragraphs
- Bold for key terms (sparingly)

❌ DON'T:
- Throat-clearing ("In today's newsletter...")
- Vague language ("many people", "often")
- Corporate speak ("leverage", "synergies")
- Walls of text
- Generic endings ("That's all for today!")

---

Now transform the content into an elite newsletter. Output in Markdown format:`;
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
