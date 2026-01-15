"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, Trash2, ExternalLink, FileText, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { deleteNewsletter } from "@/server/newsletters";
import type { NewsletterItem } from "@/server/newsletters";

interface HistoryListProps {
  newsletters: NewsletterItem[];
}

const MAX_PREVIEW_LENGTH = 150;

function getPreview(content: string): string {
  // Remove markdown formatting for preview
  const plain = content
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\n+/g, " ")
    .trim();
  
  return plain.length > MAX_PREVIEW_LENGTH
    ? `${plain.substring(0, MAX_PREVIEW_LENGTH)}...`
    : plain;
}

export function HistoryList({ newsletters: initialNewsletters }: HistoryListProps) {
  const [newsletters, setNewsletters] = useState(initialNewsletters);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleCopy = async (content: string, id: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this newsletter?")) return;
    
    setDeletingId(id);
    try {
      const success = await deleteNewsletter(id);
      if (success) {
        setNewsletters((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (newsletters.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="size-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          No newsletters yet
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Start by generating content from a YouTube video.
        </p>
        <Link href="/dashboard" className="inline-block mt-6">
          <Button>Create Newsletter</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {newsletters.map((newsletter) => {
        const isExpanded = expandedId === newsletter.id;
        
        return (
          <Card key={newsletter.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg leading-snug">
                    {newsletter.videoTitle}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    By {newsletter.videoAuthor} • YouTube ID: {newsletter.videoId}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {!isExpanded ? (
                <p className="text-muted-foreground text-sm">
                  {getPreview(newsletter.content)}
                </p>
              ) : (
                <div className="rounded-lg border bg-muted/30 p-6 max-h-[500px] overflow-y-auto">
                  <article className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-headings:mt-6 prose-headings:mb-3 prose-p:my-3 prose-p:leading-relaxed prose-strong:font-semibold prose-ul:my-3 prose-ul:list-disc prose-ul:pl-5 prose-li:my-1 prose-hr:my-6">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                      {newsletter.content}
                    </ReactMarkdown>
                  </article>
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              <div className="flex items-center justify-between w-full">
                <p className="text-muted-foreground text-xs">
                  Created: {new Date(newsletter.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(newsletter.content, newsletter.id)}
                    className="text-muted-foreground"
                  >
                    {copiedId === newsletter.id ? (
                      <>
                        <Check className="size-4 text-primary mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-muted-foreground"
                  >
                    <a
                      href={`https://youtube.com/watch?v=${newsletter.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-4 mr-1" />
                      YouTube
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(newsletter.id)}
                    disabled={deletingId === newsletter.id}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4 mr-1" />
                    Delete
                  </Button>
                  <Button onClick={() => toggleExpand(newsletter.id)}>
                    {isExpanded ? "Hide Content" : "View Content"}
                    <ChevronDown className={`size-4 ml-1 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
