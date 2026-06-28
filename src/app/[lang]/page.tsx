import Header from "@/components/Header";
import NewsCard from "@/components/NewsCard";
import DiscordButton from "@/components/DiscordButton";
import MagicSearch from "@/components/MagicSearch";
import Countdown from "@/components/Countdown";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Newspaper, Zap, Rss, ArrowRight, Flame } from "lucide-react";
import { fetchNews } from "@/lib/supabase";
import { notFound } from "next/navigation";

export const revalidate = 60; // 60 saniyede bir ISR (Incremental Static Regeneration) yenileme

interface HomeProps {
  params: Promise<{
    lang: string;
  }>;
}

export default async function Home({ params }: HomeProps) {
  const { lang } = await params;
  const locales = ["en", "tr", "es", "pt"];

  if (!locales.includes(lang)) {
    notFound();
  }

  // i18n JSON yükle
  let dict;
  try {
    dict = require(`@/locales/${lang}.json`);
  } catch (e) {
    dict = require(`@/locales/en.json`);
  }

  // Supabase'den haberleri çek
  const newsList = await fetchNews();

  // URL rotasını dille uyumlu oluşturmak için helper
  const getNewsUrl = (newsId: string) => {
    const type = lang === "tr" ? "haber" : "news";
    return `/${lang}/${type}/${newsId}`;
  };

  return (
    <>
      <Countdown dict={dict} />
      <DiscordButton />
      
      {/* Header wrapper with theme toggle integrated */}
      <Header />

      <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Floating top tools wrapper */}
        <div className="flex justify-end mb-4">
          <ThemeSwitcher />
        </div>

        {/* Hero Section */}
        <section className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neon-pink/20 bg-neon-pink/5 px-4 py-1.5 text-xs font-medium text-neon-pink">
            <Zap className="h-3 w-3 animate-pulse" />
            {dict.hero_badge}
          </div>
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
            {dict.hero_title_1}
            <span className="neon-text text-neon-pink">GTA VI</span>
            {dict.hero_title_2}
            <br />
            <span className="text-text-secondary">{dict.hero_title_sub}</span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
            {dict.hero_desc}
          </p>
        </section>

        {/* Semantic Magic Search Bar */}
        <MagicSearch />

        {/* News Section */}
        <section id="haberler" className="scroll-mt-20">
          <div className="mb-6 flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-neon-pink" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
              {dict.latest_summaries}
            </h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          {newsList && newsList.length > 0 ? (
            <div className="grid gap-6">
              {newsList.map((news) => {
                // İlgili dildeki başlık ve özet
                const title = news.title[lang] || news.title["en"] || "No Title";
                const summary = news.summary[lang] || news.summary["en"] || "No Summary";
                const score = parseFloat(news.reliability_score || "0");

                return (
                  <div key={news.id} className="relative group">
                    <a href={getNewsUrl(news.id)} className="block">
                      <NewsCard
                        title={title}
                        summary={summary}
                        sources={news.sources || []}
                        coverImageUrl={news.cover_image_url}
                        createdAt={news.created_at}
                      />
                    </a>
                    
                    {/* Floating elements inside list items for detail redirection & premium scores */}
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-none">
                      {/* Reliability Score Badge */}
                      <span className={`px-2 py-1 text-[10px] font-black rounded-lg border shadow-lg ${
                        score >= 7.5
                          ? "bg-neon-cyan/20 border-neon-cyan/45 text-neon-cyan neon-text-cyan"
                          : score >= 4.5
                          ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
                          : "bg-red-500/10 border-red-500/30 text-red-500"
                      }`}>
                        Reliability: {score.toFixed(1)}/10
                      </span>

                      {/* Flame count */}
                      {news.flames_count > 0 && (
                        <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-black rounded-lg bg-neon-pink/15 border border-neon-pink/35 text-neon-pink neon-text">
                          <Flame className="h-3 w-3 fill-neon-pink" />
                          {news.flames_count}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="glass-card text-center py-16 px-4">
              <Rss className="h-12 w-12 text-text-secondary/20 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-bold text-text-primary mb-2">
                {dict.no_summaries}
              </h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto mb-6">
                {dict.no_summaries_desc}
              </p>
              <a
                href="https://discord.gg/zuzurp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-neon-pink font-semibold hover:underline"
              >
                {dict.join_discord} <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          )}
        </section>

        {/* Zuzu RP CTA Section */}
        <section className="mt-16 mb-8 text-center">
          <div className="glass-card p-8 sm:p-12 relative overflow-hidden">
            {/* Background design accents */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-neon-pink/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-neon-cyan/10 rounded-full blur-2xl pointer-events-none" />

            <h3 className="mb-3 text-2xl font-extrabold text-text-primary sm:text-3xl">
              {dict.discord_cta_title}
            </h3>
            <p className="mx-auto mb-6 max-w-lg text-sm text-text-secondary leading-relaxed">
              {dict.discord_cta_desc}
            </p>
            <a
              href="https://discord.gg/zuzurp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-neon-pink px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-neon-pink-soft animate-pulse-glow"
            >
              {dict.discord_cta_btn}
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-text-secondary/50">
        <p className="mb-1">
          © {new Date().getFullYear()} Zuzu RP — GTA VI AI Aggregator & Funnel.
        </p>
        <p className="text-[10px]">
          All news is translated and summarized by AI for research purposes.
        </p>
      </footer>
    </>
  );
}
