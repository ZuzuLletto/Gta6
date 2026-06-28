-- =============================================
-- ZUZU RP NEWS — Supabase Veritabanı Şeması
-- =============================================
-- Bu SQL'i Supabase Dashboard > SQL Editor'de çalıştırın.

-- 1. NEWS TABLOSU
CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- sources formatı: [{"name": "DonanımHaber", "url": "https://..."}, ...]
  original_links TEXT[] NOT NULL DEFAULT '{}',
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PERFORMANS İNDEXLERİ
-- En son haberler için sıralama indexi
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);

-- Duplicate kontrolü için GIN index (original_links array araması)
CREATE INDEX IF NOT EXISTS idx_news_original_links ON news USING GIN(original_links);

-- 3. ROW LEVEL SECURITY (RLS)
-- Herkese okuma izni, yazma sadece service_role key ile
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON news
  FOR SELECT
  USING (true);

CREATE POLICY "Service role insert" ON news
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role update" ON news
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4. UPDATED_AT OTOMATİK GÜNCELLEME FONKSİYONU
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. YARDIMCI: Belirli bir linkin zaten var olup olmadığını kontrol eden fonksiyon
CREATE OR REPLACE FUNCTION link_exists(check_link TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM news WHERE check_link = ANY(original_links)
  );
END;
$$ LANGUAGE plpgsql;
