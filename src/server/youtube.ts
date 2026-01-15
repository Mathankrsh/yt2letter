"use server";

export type Subtitle = {
  start: string;
  dur: string;
  text: string;
};

export type YouTubeVideoData = {
  title: string;
  description: string;
  duration: string;
  slug: string;
  author: string;
  captions: Subtitle[];
};

// Regex patterns for extracting video ID
const VIDEO_ID_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  /youtube\.com\/v\/([^&\n?#]+)/,
];

// Regex to remove @ prefix from URLs
const AT_PREFIX_REGEX = /^@+/;

// Function to clean YouTube URLs
function cleanYouTubeUrl(url: string): string {
  let cleanedUrl = url.replace(AT_PREFIX_REGEX, "");

  const hasProtocol =
    cleanedUrl.startsWith("http://") || cleanedUrl.startsWith("https://");
  if (!hasProtocol) {
    cleanedUrl = `https://${cleanedUrl}`;
  }

  return cleanedUrl;
}

function extractVideoId(url: string): string | null {
  for (const pattern of VIDEO_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

async function getVideoInfoFromYouTubeAPI(videoId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "YouTube API key is not configured. Please set YOUTUBE_API_KEY environment variable."
    );
  }

  console.log(`[YouTube API] Fetching video info for: ${videoId}`);
  
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[YouTube API Error]", {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
    throw new Error(
      `YouTube API request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error("Video not found or not accessible");
  }

  const video = data.items[0];
  console.log(`[YouTube API] Got video: ${video.snippet.title}`);

  return {
    title: video.snippet.title,
    description: video.snippet.description,
    channelTitle: video.snippet.channelTitle,
    duration: video.contentDetails.duration,
  };
}

/**
 * Fetch transcript from Railway Python microservice.
 */
async function getVideoCaptions(videoId: string): Promise<Subtitle[]> {
  const railwayUrl = process.env.TRANSCRIPT_SERVICE_URL;

  if (!railwayUrl) {
    throw new Error(
      "TRANSCRIPT_SERVICE_URL not configured. Please set this environment variable."
    );
  }

  const transcriptUrl = `${railwayUrl}/transcript`;
  console.log(`[Railway] Requesting transcript from: ${transcriptUrl}`);
  console.log(`[Railway] Video ID: ${videoId}`);

  try {
    const response = await fetch(transcriptUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "text/plain",
      },
      body: JSON.stringify({ videoId }),
    });

    console.log(`[Railway] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Railway] Error response: ${errorText}`);
      throw new Error(errorText || `Railway service returned ${response.status}`);
    }

    const transcriptText = await response.text();
    console.log(`[Railway] Got ${transcriptText.length} chars`);

    if (!transcriptText || transcriptText.trim().length === 0) {
      throw new Error("No captions available for this video");
    }

    return [
      {
        start: "0",
        dur: "0",
        text: transcriptText.trim(),
      },
    ];
  } catch (error) {
    console.error("[Railway] Fetch failed:", error);
    if (error instanceof Error) {
      throw new Error(`Transcript fetch failed: ${error.message}`);
    }
    throw new Error("Transcript fetch failed: Unknown error");
  }
}

/**
 * Extract YouTube video data.
 */
export async function extractYouTubeData(
  url: string
): Promise<YouTubeVideoData> {
  try {
    const cleanedUrl = cleanYouTubeUrl(url);
    console.log(`[YouTube] Cleaned URL: ${cleanedUrl}`);
    
    const videoId = extractVideoId(cleanedUrl);
    console.log(`[YouTube] Extracted video ID: ${videoId}`);

    if (!videoId) {
      throw new Error("Invalid YouTube URL - could not extract video ID");
    }

    const videoInfo = await getVideoInfoFromYouTubeAPI(videoId);
    const captions = await getVideoCaptions(videoId);

    return {
      title: videoInfo.title || "Unknown Title",
      description: videoInfo.description || "",
      duration: videoInfo.duration || "PT0S",
      author: videoInfo.channelTitle || "Unknown Author",
      slug: videoId,
      captions,
    };
  } catch (error) {
    console.error("[YouTube] extractYouTubeData failed:", error);
    throw new Error(
      `Failed to extract YouTube data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
