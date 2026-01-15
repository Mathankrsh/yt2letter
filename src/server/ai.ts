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
 * CRITICAL: This prompt MUST produce properly formatted markdown with clear visual separation.
 */
function createNewsletterPrompt(videoData: any, rewrittenContent: string): string {
  const durationMinutes = Math.floor(
    Number.parseInt(videoData.duration, 10) / SECONDS_PER_MINUTE
  );

  return `You are an elite newsletter writer. Transform the content below into a beautifully formatted newsletter.

---

**Video:** ${videoData.title} by ${videoData.author} (${durationMinutes} min)

**Content:**
${rewrittenContent}

---

## CRITICAL FORMATTING RULES (MUST FOLLOW EXACTLY)

1. **USE MARKDOWN HEADERS**: Every section MUST start with \`## Header Name\` (with the ## symbols)
2. **BLANK LINES ARE MANDATORY**: Put TWO blank lines before every ## header
3. **SHORT PARAGRAPHS**: Maximum 2-3 sentences per paragraph
4. **BLANK LINE BETWEEN PARAGRAPHS**: Every paragraph must have a blank line after it
5. **BULLET POINTS**: Use \`- \` for lists, with blank line before and after the list

## EXACT OUTPUT FORMAT (COPY THIS STRUCTURE)

**Subject:** [Compelling 6-10 word subject line]


[Opening hook - 1-2 punchy sentences that grab attention]

[Why this matters - 2-3 sentences of context]


## [First Major Insight - Descriptive Title]

[First paragraph about this topic - 2-3 sentences max]

[Second paragraph with specific example or data - 2-3 sentences]


## [Second Major Insight - Descriptive Title]

[Explanation paragraph - 2-3 sentences]

[Supporting details or example - 2-3 sentences]


## [Third Major Insight - Descriptive Title]

[Key points about this insight - 2-3 sentences]


## Key Takeaways

- [Specific actionable insight #1]

- [Specific actionable insight #2]

- [Specific actionable insight #3]

---

## STYLE RULES

- Write conversationally, like explaining to a smart friend
- Use concrete numbers and specific examples
- Bold **key terms** sparingly for emphasis
- NO corporate jargon (leverage, synergies, etc.)
- NO generic openings ("In today's newsletter...")
- Target 600-1000 words total

---

NOW OUTPUT THE NEWSLETTER IN THE EXACT FORMAT SHOWN ABOVE:`;
}

/**
 * Post-process the newsletter content to ensure proper formatting.
 * This fixes common AI output issues.
 */
function formatNewsletterContent(content: string): string {
  let formatted = content;
  
  // Ensure headers have proper spacing (two blank lines before ##)
  formatted = formatted.replace(/\n*(##\s)/g, '\n\n\n$1');
  
  // Ensure there's a blank line after headers
  formatted = formatted.replace(/(##[^\n]+)\n([^\n])/g, '$1\n\n$2');
  
  // Add spacing around horizontal rules
  formatted = formatted.replace(/\n*---\n*/g, '\n\n---\n\n');
  
  // Ensure bullet points have spacing
  formatted = formatted.replace(/\n*(-\s[^\n]+)\n(-\s)/g, '\n$1\n\n$2');
  
  // Clean up excessive blank lines (more than 3)
  formatted = formatted.replace(/\n{4,}/g, '\n\n\n');
  
  // Trim leading/trailing whitespace
  formatted = formatted.trim();
  
  return formatted;
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

  let newsletterContent = result.candidates[0].content.parts[0].text || "";

  if (!newsletterContent || newsletterContent.length < MIN_NEWSLETTER_LENGTH) {
    throw new Error(
      `Generated newsletter is too short: ${newsletterContent?.length || 0} characters`
    );
  }

  // Post-process to ensure proper formatting
  newsletterContent = formatNewsletterContent(newsletterContent);

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
