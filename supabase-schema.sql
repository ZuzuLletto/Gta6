-- =============================================
-- ZUZU RP NEWS — Gelişmiş Supabase Şeması
-- =============================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştırın.

-- 0. PGVECTOR UZANTISINI AKTİF ET
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. NEWS TABLOSU (Çok Dilli Entegrasyon)
CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title JSONB NOT NULL DEFAULT '{}'::jsonb, -- {"en": "...", "tr": "...", "es": "...", "pt": "..."}
  summary JSONB NOT NULL DEFAULT '{}'::jsonb, -- {"en": "...", "tr": "...", "es": "...", "pt": "..."}
  normalized_title TEXT, -- Arama ve local deduplication için varsayılan/İngilizce başlık normalizasyonu
  sources JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{"name": "Webtekno", "url": "https://..."}, ...]
  original_links TEXT[] NOT NULL DEFAULT '{}',
  cover_image_url TEXT,
  embedding vector(768), -- Gemini text-embedding-004 için vektör
  reliability_score NUMERIC(3,1) DEFAULT 0.0, -- 0.0 - 10.0 arası güvenilirlik skoru
  flames_count INT DEFAULT 0, -- Alev atma (Beğeni) sayısı
  tags TEXT[] DEFAULT '{}', -- Dinamik etiketler
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. NEWS LIKES (ALEV ATMA TABLOSU)
CREATE TABLE IF NOT EXISTS news_likes (
  news_id UUID REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (news_id, user_id)
);

-- 3. COMMENTS (YORUMLAR TABLOSU - Discord OAuth Entegrasyonlu)
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL, -- Discord Global Name
  user_avatar TEXT, -- Discord Avatar URL
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COMMENT LIKES (YORUM BEĞENİ TABLOSU)
CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

-- 5. PERFORMANS İNDEXLERİ
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_original_links ON news USING GIN(original_links);
CREATE INDEX IF NOT EXISTS idx_news_normalized_title ON news(normalized_title);
CREATE INDEX IF NOT EXISTS idx_comments_news_id ON comments(news_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- 6. UPDATED_AT OTOMATİK GÜNCELLEME TETİKLEYİCİSİ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_news_updated_at ON news;
CREATE TRIGGER update_news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. YARDIMCI: Belirli bir linkin varlığını kontrol etme
CREATE OR REPLACE FUNCTION link_exists(check_link TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM news WHERE check_link = ANY(original_links)
  );
END;
$$ LANGUAGE plpgsql;

-- 8. RPC: Vektörel Arama Fonksiyonu (Cosine Similarity)
CREATE OR REPLACE FUNCTION search_news(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  title JSONB,
  summary JSONB,
  sources JSONB,
  original_links TEXT[],
  cover_image_url TEXT,
  reliability_score NUMERIC,
  flames_count INT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    news.id,
    news.title,
    news.summary,
    news.sources,
    news.original_links,
    news.cover_image_url,
    news.reliability_score,
    news.flames_count,
    news.tags,
    news.created_at,
    1 - (news.embedding <=> query_embedding) AS similarity
  FROM news
  WHERE 1 - (news.embedding <=> query_embedding) > match_threshold
  ORDER BY news.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 9. RPC/FONKSİYON: Kullanıcının toplam yorum sayısına göre rozet (badge) durumunu hesaplar
CREATE OR REPLACE FUNCTION get_user_badge(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  comment_cnt INT;
BEGIN
  SELECT COUNT(*) INTO comment_cnt FROM comments WHERE user_id = user_uuid;
  
  IF comment_cnt >= 30 THEN
    RETURN 'Gta delisi';
  ELSIF comment_cnt >= 10 THEN
    RETURN 'Haber Avcısı';
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 10. TETİKLEYİCİLER: Beğeni ve alev sayılarını otomatik artırma/azaltma
-- News Likes (Alev Sayısı) tetikleyicisi
CREATE OR REPLACE FUNCTION handle_news_like()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE news SET flames_count = flames_count + 1 WHERE id = NEW.news_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE news SET flames_count = flames_count - 1 WHERE id = OLD.news_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_news_like
  AFTER INSERT OR DELETE ON news_likes
  FOR EACH ROW
  EXECUTE FUNCTION handle_news_like();

-- Comment Likes (Yorum Beğeni Sayısı) tetikleyicisi
CREATE OR REPLACE FUNCTION handle_comment_like()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_comment_like
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION handle_comment_like();
