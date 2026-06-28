"use client";

import { ExternalLink, Clock } from "lucide-react";

interface Source {
  name: string;
  url: string;
}

interface NewsCardProps {
  title: string;
  summary: string;
  sources: Source[];
  coverImageUrl?: string | null;
  createdAt: string;
}

export default function NewsCard({
  title,
  summary,
  sources,
  coverImageUrl,
  createdAt,
}: NewsCardProps) {
  const timeAgo = getTimeAgo(createdAt);

  return (
    <article className="glass-card card-animate overflow-hidden">
      {/* Cover Image */}
      {coverImageUrl && (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={coverImageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="p-5 sm:p-6">
        {/* Timestamp */}
        <div className="mb-3 flex items-center gap-1.5 text-xs text-text-muted">
          <Clock className="h-3 w-3" />
          <time>{timeAgo}</time>
        </div>

        {/* Title */}
        <h2 className="mb-3 text-xl font-bold leading-tight text-text-primary transition-colors hover:text-neon-pink sm:text-2xl">
          {title}
        </h2>

        {/* Summary */}
        <p className="mb-4 text-sm leading-relaxed text-text-secondary line-clamp-4">
          {summary}
        </p>

        {/* Source Badges */}
        <div className="flex flex-wrap gap-2">
          {sources.map((source, index) => (
            <a
              key={index}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-badge"
            >
              <ExternalLink className="h-3 w-3" />
              {source.name}
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Az önce";
  if (diffMins < 60) return `${diffMins} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;

  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
