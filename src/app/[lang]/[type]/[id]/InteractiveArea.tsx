"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Flame, MessageCircle, ThumbsUp, Sparkles, LogIn, ChevronDown, Check } from "lucide-react";

interface Comment {
  id: string;
  user_name: string;
  user_avatar: string;
  content: string;
  likes_count: number;
  created_at: string;
  badge?: string | null;
}

interface InteractiveAreaProps {
  newsId: string;
  lang: string;
  dict: any;
  initialFlames: number;
}

export default function InteractiveArea({
  newsId,
  lang,
  dict,
  initialFlames,
}: InteractiveAreaProps) {
  const [session, setSession] = useState<any>(null);
  const [flames, setFlames] = useState(initialFlames);
  const [hasLikedNews, setHasLikedNews] = useState(false);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // newest, popular, liked
  const [loadingComments, setLoadingComments] = useState(true);
  const [postingComment, setPostingComment] = useState(false);
  const [hasLikedComments, setHasLikedComments] = useState<{ [key: string]: boolean }>({});
  
  // Çevrilmiş yorumları bellekte saklayalım: { [commentId]: translatedText }
  const [translations, setTranslations] = useState<{ [key: string]: string }>({});
  const [translatingIds, setTranslatingIds] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // 1. Session durumunu dinle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkUserNewsLike(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkUserNewsLike(session.user.id);
      }
    });

    // 2. Yorumları çek
    fetchComments();

    return () => subscription.unsubscribe();
  }, [sortBy]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/comments?newsId=${newsId}&sortBy=${sortBy}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments(false);
    }
  };

  const checkUserNewsLike = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("news_likes")
        .select("*")
        .eq("news_id", newsId)
        .eq("user_id", userId)
        .maybeSingle();
      setHasLikedNews(!!data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDiscordLogin = () => {
    supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: window.location.origin + "/auth/callback?next=" + window.location.pathname,
      },
    });
  };

  const handleFlameClick = async () => {
    if (!session) {
      handleDiscordLogin();
      return;
    }

    try {
      const res = await fetch("/api/news/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ newsId }),
      });

      if (res.ok) {
        const data = await res.json();
        setHasLikedNews(data.liked);
        setFlames((prev) => (data.liked ? prev + 1 : prev - 1));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !commentContent.trim() || postingComment) return;

    setPostingComment(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ newsId, content: commentContent }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [newComment, ...prev]);
        setCommentContent("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPostingComment(false);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!session) {
      handleDiscordLogin();
      return;
    }

    try {
      const res = await fetch("/api/comments/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ commentId }),
      });

      if (res.ok) {
        const data = await res.json();
        setHasLikedComments((prev) => ({ ...prev, [commentId]: data.liked }));
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, likes_count: data.liked ? c.likes_count + 1 : c.likes_count - 1 }
              : c
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const translateComment = async (commentId: string, text: string) => {
    // Zaten çevrildiyse kapat/aç davranışı (toggle)
    if (translations[commentId]) {
      setTranslations((prev) => {
        const copy = { ...prev };
        delete copy[commentId];
        return copy;
      });
      return;
    }

    setTranslatingIds((prev) => ({ ...prev, [commentId]: true }));
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, targetLang: lang }),
      });

      if (res.ok) {
        const data = await res.json();
        setTranslations((prev) => ({ ...prev, [commentId]: data.translatedText }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTranslatingIds((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Interaction Bar */}
      <div className="flex items-center justify-between glass-card p-4">
        <button
          onClick={handleFlameClick}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
            hasLikedNews
              ? "bg-neon-pink text-white shadow-[0_0_15px_rgba(255,0,255,0.4)] scale-105"
              : "bg-white/5 border border-white/10 hover:border-neon-pink/30 hover:bg-neon-pink/5 text-text-primary"
          }`}
        >
          <Flame className={`h-5 w-5 ${hasLikedNews ? "fill-white animate-pulse" : "text-neon-pink"}`} />
          <span>{flames} Flames</span>
        </button>

        <div className="flex items-center gap-1 text-xs text-text-secondary">
          <MessageCircle className="h-4 w-4" />
          <span>{comments.length} {dict.comments_count}</span>
        </div>
      </div>

      {/* Yorumlar Bölümü */}
      <section className="glass-card p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 className="text-lg font-extrabold text-text-primary flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-neon-pink" />
            {dict.comments_section}
          </h2>

          {/* Sıralama Filtresi */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-muted">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-text-primary focus:outline-none focus:border-neon-pink transition-colors cursor-pointer"
            >
              <option value="newest" className="bg-[#0e0e0e]">{dict.comments_sort_newest}</option>
              <option value="popular" className="bg-[#0e0e0e]">{dict.comments_sort_popular}</option>
              <option value="liked" className="bg-[#0e0e0e]">{dict.comments_sort_liked}</option>
            </select>
          </div>
        </div>

        {/* Yorum Yazma Alanı */}
        <div className="mb-8">
          {session ? (
            <form onSubmit={handlePostComment} className="space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={session.user.user_metadata.avatar_url || "https://avatar.vercel.sh/discord"}
                  alt={session.user.user_metadata.full_name}
                  className="h-8 w-8 rounded-full border border-white/10"
                />
                <span className="text-xs font-bold text-text-secondary">
                  @{session.user.user_metadata.custom_claims?.global_name || session.user.user_metadata.full_name}
                </span>
              </div>
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder={dict.comment_placeholder}
                rows={3}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-pink focus:bg-white/8 transition-all resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={postingComment || !commentContent.trim()}
                  className="px-5 py-2.5 rounded-full bg-neon-pink hover:bg-neon-pink-soft text-white text-xs font-bold shadow-lg hover:scale-102 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {postingComment ? "Posting..." : dict.comment_submit}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6 px-4 border border-dashed border-white/10 rounded-2xl bg-white/3">
              <LogIn className="h-8 w-8 text-text-muted mx-auto mb-3" />
              <p className="text-xs text-text-secondary mb-4">
                {dict.discord_login_to_comment}
              </p>
              <button
                onClick={handleDiscordLogin}
                className="inline-flex items-center gap-2 rounded-full bg-neon-pink px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-neon-pink-soft hover:scale-105 transition-all animate-pulse-glow"
              >
                <MessageCircle className="h-4 w-4 fill-white" />
                {dict.discord_login_btn}
              </button>
            </div>
          )}
        </div>

        {/* Yorumlar Listesi */}
        {loadingComments ? (
          <div className="text-center py-8 text-xs text-text-muted">Loading comments...</div>
        ) : comments.length > 0 ? (
          <div className="space-y-5 divide-y divide-white/5">
            {comments.map((comment) => {
              const isTranslated = !!translations[comment.id];
              const isTranslating = !!translatingIds[comment.id];
              const displayContent = translations[comment.id] || comment.content;

              return (
                <div key={comment.id} className="pt-5 first:pt-0">
                  <div className="flex items-start gap-3">
                    {/* Discord Avatar */}
                    <img
                      src={comment.user_avatar || "https://avatar.vercel.sh/discord"}
                      alt={comment.user_name}
                      className="h-9 w-9 rounded-full border border-white/15 object-cover"
                    />

                    {/* Comment Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-text-primary">
                          @{comment.user_name}
                        </span>

                        {/* Rozetler (Badge) */}
                        {comment.badge && (
                          <span
                            className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border ${
                              comment.badge === "Gta delisi"
                                ? "bg-neon-pink/10 border-neon-pink/30 text-neon-pink neon-text"
                                : "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan neon-text-cyan"
                            }`}
                          >
                            {comment.badge === "Gta delisi"
                              ? dict.badge_gta_delisi
                              : dict.badge_haber_avcisi}
                          </span>
                        )}

                        <span className="text-[10px] text-text-muted">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Content */}
                      <p className="text-sm text-text-secondary leading-relaxed break-words whitespace-pre-wrap">
                        {displayContent}
                      </p>

                      {/* Comment Actions (Beğen & Çevir) */}
                      <div className="flex items-center gap-4 mt-3">
                        <button
                          onClick={() => handleCommentLike(comment.id)}
                          className={`flex items-center gap-1.5 text-xs transition-colors ${
                            hasLikedComments[comment.id]
                              ? "text-neon-cyan font-bold"
                              : "text-text-muted hover:text-text-secondary"
                          }`}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>{comment.likes_count}</span>
                        </button>

                        {/* Translation Button */}
                        <button
                          onClick={() => translateComment(comment.id, comment.content)}
                          disabled={isTranslating}
                          className="flex items-center gap-1 text-[11px] font-bold text-neon-pink hover:underline disabled:opacity-50"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>
                            {isTranslating
                              ? "Translating..."
                              : isTranslated
                              ? dict.show_original
                              : dict.translate_comment}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-text-muted">
            Henüz yorum yapılmamış. İlk yorumu sen yaz!
          </div>
        )}
      </section>
    </div>
  );
}
