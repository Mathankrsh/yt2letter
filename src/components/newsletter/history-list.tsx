"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Copy, Check, Trash2, ExternalLink, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { deleteNewsletter } from "@/server/newsletters";
import type { NewsletterItem } from "@/server/newsletters";

interface HistoryListProps {
  newsletters: NewsletterItem[];
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
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="size-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No newsletters yet</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">
            Generate your first newsletter from a YouTube video
          </p>
          <Button asChild>
            <Link href="/dashboard">Create Newsletter</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {newsletters.map((newsletter) => (
        <Card key={newsletter.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0 flex-1">
                <CardTitle className="text-base line-clamp-1">
                  {newsletter.videoTitle}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-xs">
                  <span>{newsletter.videoAuthor}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(newsletter.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </CardDescription>
              </div>
              <CardAction>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleCopy(newsletter.content, newsletter.id)}
                    title="Copy content"
                  >
                    {copiedId === newsletter.id ? (
                      <Check className="size-4 text-primary" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    asChild
                    title="View on YouTube"
                  >
                    <a
                      href={`https://youtube.com/watch?v=${newsletter.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(newsletter.id)}
                    disabled={deletingId === newsletter.id}
                    title="Delete"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardAction>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`overflow-hidden transition-all duration-200 ${
                expandedId === newsletter.id ? "max-h-[600px]" : "max-h-24"
              }`}
            >
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-strong:font-semibold prose-ul:my-2 prose-li:my-0">
                  <ReactMarkdown>{newsletter.content}</ReactMarkdown>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpand(newsletter.id)}
              className="mt-2 w-full text-muted-foreground"
            >
              {expandedId === newsletter.id ? "Show less" : "Show more"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
