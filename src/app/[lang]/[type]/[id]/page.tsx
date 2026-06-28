import { notFound, redirect } from "next/navigation";
import Header from "@/components/Header";
import DiscordButton from "@/components/DiscordButton";
import Countdown from "@/components/Countdown";
import { createClient } from "@supabase/supabase-js";
import {
  ExternalLink,
  Flame,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  MessageCircle,
  Clock,
  ThumbsUp,
  Globe,
} from "lucide-react";
import InteractiveArea from "./InteractiveArea";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface PageProps {
  params: Promise<{
    lang: string;
    type: string;
    id: string;
  }>;
}

export default async function NewsDetail({ params }: PageProps) {
  const { lang, type, id } = await params;
  const locales = ["en", "tr", "es", "pt"];

  if (!locales.includes(lang)) {
    notFound();
  }

  // URL Doğrulama (tr ise "haber", diğer diller ise "news" olmalı)
  const expectedType = lang === "tr" ? "haber" : "news";
  if (type !== expectedType) {
    redirect(`/${lang}/${expectedType}/${id}`);
  }

  // i18n JSON yükle
  let dict;
  try {
    dict = require(`@/locales/${lang}.json`);
  } catch (e) {
    dict = require(`@/locales/en.json`);
  }

  // Supabase'den haberi çek
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: news, error } = await supabase
    .from("news")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !news) {
    notFound();
  }

  // İlgili dildeki başlık ve özet
  const title = news.title[lang] || news.title["en"] || "No Title Available";
  const summary = news.summary[lang] || news.summary["en"] || "No Content Available";
  const score = parseFloat(news.reliability_score || "0");
  const timeAgo = getTimeAgo(news.created_at, lang);

  return (
    <>
      <Countdown dict={dict} />
      <DiscordButton />
      <Header />

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        {/* News Detail Card */}
        <article className="glass-card overflow-hidden">
          {/* Cover Image */}
          {news.cover_image_url && (
            <div className="relative h-64 sm:h-80 w-full overflow-hidden">
              <img
                src={news.cover_image_url}
                alt={title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
            </div>
          )}

          <div className="p-6 sm:p-8">
            {/* Meta */}
            <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {timeAgo}
              </span>

              {/* Dynamic Tags */}
              {news.tags && news.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {news.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="mb-5 text-2xl font-black leading-tight text-text-primary sm:text-3xl lg:text-4xl">
              {title}
            </h1>

            {/* Google Translate Embed for other languages */}
            <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-text-secondary flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-neon-pink" />
                {dict.google_translate_label}
              </span>
              <div id="google_translate_element" className="google-translate-container"></div>
            </div>

            {/* Summary */}
            <div className="mb-8 text-sm leading-relaxed text-text-primary whitespace-pre-line sm:text-base">
              {summary}
            </div>

            {/* Source list */}
            <div className="mb-8 border-t border-white/5 pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">
                Original Sources
              </h3>
              <div className="flex flex-wrap gap-2">
                {news.sources &&
                  news.sources.map((src: any, index: number) => (
                    <a
                      key={index}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-badge"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {src.name}
                    </a>
                  ))}
              </div>
            </div>

            {/* Reliability Score Bar */}
            <div className="border-t border-white/5 pt-6 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
                  {dict.reliability_score}
                </h3>
                <span
                  className={`text-lg font-black ${
                    score >= 7.5
                      ? "text-neon-cyan"
                      : score >= 4.5
                      ? "text-yellow-400"
                      : "text-red-500"
                  }`}
                >
                  {score.toFixed(1)}/10
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-500 ${
                    score >= 7.5
                      ? "bg-neon-cyan shadow-[0_0_10px_rgba(0,255,204,0.5)]"
                      : score >= 4.5
                      ? "bg-yellow-400"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${score * 10}%` }}
                />
              </div>

              {/* Score indicators info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-[10px] uppercase tracking-wider text-text-muted">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3 text-neon-cyan" />
                  <span>{dict.reliability_source}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3 text-neon-cyan" />
                  <span>{dict.reliability_evidence}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-yellow-400" />
                  <span>{dict.reliability_contradiction}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="h-3 w-3 text-text-muted" />
                  <span>{dict.reliability_history}</span>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Client Interactive Area (Likes & Comments Section) */}
        <InteractiveArea
          newsId={id}
          lang={lang}
          dict={dict}
          initialFlames={news.flames_count || 0}
        />
      </main>

      {/* Google Translate Initialization Script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: 'de,fr,it,ru,ja,ko,zh-CN,ar',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE
              }, 'google_translate_element');
            }
          `,
        }}
      />
      <script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" />
    </>
  );
}

function getTimeAgo(dateString: string, lang: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const tr = {
    now: "Az önce",
    min: "dakika önce",
    hour: "saat önce",
    day: "gün önce",
  };
  const en = {
    now: "Just now",
    min: "mins ago",
    hour: "hours ago",
    day: "days ago",
  };
  const es = {
    now: "Hace un momento",
    min: "minutos antes",
    hour: "horas antes",
    day: "días antes",
  };
  const pt = {
    now: "Agora mesmo",
    min: "minutos atrás",
    hour: "horas atrás",
    day: "dias atrás",
  };

  const d = lang === "tr" ? tr : lang === "es" ? es : lang === "pt" ? pt : en;

  if (diffMins < 1) return d.now;
  if (diffMins < 60) return `${diffMins} ${d.min}`;
  if (diffHours < 24) return `${diffHours} ${d.hour}`;
  if (diffDays < 7) return `${diffDays} ${d.day}`;

  return date.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
