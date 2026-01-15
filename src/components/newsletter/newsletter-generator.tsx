"use client";

import { useState } from "react";
import { Loader2, Copy, Check, Sparkles, Youtube } from "lucide-react";
import { generateNewsletter } from "@/server/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          YouTube to Newsletter
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Transform any YouTube video into an engaging email newsletter in seconds.
        </p>
      </div>

      {/* Input Section */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Youtube className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Paste Video URL</CardTitle>
              <CardDescription>
                Enter a YouTube video URL to convert
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url" className="sr-only">YouTube Video URL</Label>
              <Input
                id="youtube-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                disabled={isGenerating}
                required
                className="h-12 text-base border-2 focus:border-primary"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                <p className="font-medium">Error</p>
                <p className="mt-1 opacity-90">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={isGenerating || !isValidYoutubeUrl(youtubeUrl)}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Newsletter...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Newsletter
                </>
              )}
            </Button>

            {isGenerating && (
              <p className="text-center text-sm text-muted-foreground">
                This may take up to a minute depending on video length
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Output Section */}
      {newsletter && (
        <Card className="border-2 shadow-lg">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                Newsletter Generated
              </CardTitle>
              <CardDescription className="line-clamp-1">
                From: {newsletter.videoTitle}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="shrink-0 border-2"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-y-auto rounded-lg border-2 bg-muted/30 p-6">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {newsletter.content}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
