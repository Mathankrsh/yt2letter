"use client";

import { useState } from "react";
import { Loader2, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { generateNewsletter } from "@/server/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";

export function NewsletterGenerator() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [newsletter, setNewsletter] = useState<{
    videoTitle: string;
    content: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError("");
    setNewsletter(null);

    try {
      const result = await generateNewsletter(youtubeUrl);
      setNewsletter({
        videoTitle: result.videoTitle,
        content: result.content,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate newsletter"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!newsletter) return;

    try {
      await navigator.clipboard.writeText(newsletter.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const isValidYoutubeUrl = (url: string) => {
    return (
      url.includes("youtube.com/watch") ||
      url.includes("youtu.be/") ||
      url.includes("youtube.com/embed/")
    );
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-primary">
          What are we creating today?
        </h1>
      </div>

      {/* Input Section */}
      <div className="flex flex-col items-center gap-4">
        <form onSubmit={handleGenerate} className="w-full max-w-xl">
          <div className="flex gap-2 items-center p-1 rounded-full border shadow-sm bg-background">
            <Input
              type="url"
              placeholder="Paste YouTube URL here..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={isGenerating}
              required
              className="flex-1 border-0 shadow-none focus-visible:ring-0 bg-transparent h-10 px-4"
            />
            <Button
              type="submit"
              size="default"
              disabled={isGenerating || !isValidYoutubeUrl(youtubeUrl)}
              className="rounded-full px-6"
            >
              {isGenerating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Generate"
              )}
            </Button>
          </div>
        </form>

        {isGenerating && (
          <p className="text-sm text-muted-foreground animate-pulse">
            Generating your newsletter... This may take up to a minute.
          </p>
        )}

        {error && (
          <div className="w-full max-w-xl rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
            <p className="font-medium">Error</p>
            <p className="mt-1 opacity-90">{error}</p>
          </div>
        )}
      </div>

      {/* Output Section */}
      {newsletter && (
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Check className="size-5 text-primary" />
                  Newsletter Generated
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  From: {newsletter.videoTitle}
                </CardDescription>
              </div>
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="size-4 text-primary" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      Copy
                    </>
                  )}
                </Button>
              </CardAction>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-y-auto rounded-lg border bg-white dark:bg-zinc-950 p-8 sm:p-10">
              <article className="newsletter-content">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children }) => (
                      <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground first:mt-0">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-medium mt-8 mb-3 text-foreground">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-base leading-relaxed text-foreground/90 mb-6">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-6 my-6 space-y-3">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-base leading-relaxed text-foreground/90">
                        {children}
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic">{children}</em>
                    ),
                    hr: () => (
                      <hr className="my-8 border-border" />
                    ),
                  }}
                >
                  {newsletter.content}
                </ReactMarkdown>
              </article>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
