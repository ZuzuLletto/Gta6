"""
Zuzu RP News — Küresel Çok Dilli Scraper (Nitter RSS, Gemini AI Çeviri & Güvenilirlik)

Özellikler:
1. Basın, Resmi ve Twitter (Nitter RSS) kaynaklarının taranması.
2. Yayın tarihi ve fuzzy matching filtreleri (CPU & API tasarrufu).
3. Gemini 2.0 Flash ile haber birleştirme ve çok dilli (EN, TR, ES, PT) JSON çıktı üretimi.
4. Gemini ile detaylı Güvenilirlik Skoru (Reliability Score) hesaplama.
5. Makale URL'inden BeautifulSoup ile og:image (kapak resmi) çekme.
6. Gemini text-embedding-004 ile semantik anlam vektörü oluşturma.
7. Supabase çok dilli news tablosuna veri kaydı.
"""

import os
import re
import json
import time
import sys
import socket
from datetime import datetime, timezone, timedelta
import feedparser
import requests
from bs4 import BeautifulSoup
from google import genai
from thefuzz import fuzz
from supabase_client import (
    get_client,
    link_exists,
    title_exists,
    get_recent_news_metadata,
    insert_news,
    normalize_title,
)

# Socket timeout ayarı (Feed taranırken askıda kalmayı önler)
socket.setdefaulttimeout(10)

# Windows Unicode çıktı ayarı
if sys.platform.startswith("win"):
    sys.stdout.reconfigure(encoding="utf-8")

# =============================================
# ENV YÜKLEME (LOKAL TESTLER İÇİN)
# =============================================
env_paths = [".env.local", "../.env.local", "zuzu-rp-news/.env.local"]
for path in env_paths:
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    if key not in os.environ:
                        os.environ[key] = val

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Taranacak RSS ve Nitter Twitter Beslemeleri
RSS_SOURCES = [
    # Resmi Kaynaklar
    {"name": "Rockstar Games", "url": "https://www.rockstargames.com/newswire.xml", "category": "official"},
    {"name": "RockstarGames (Twitter)", "url": "https://nitter.perennialte.ch/RockstarGames/rss", "category": "official"},
    
    # Saygın Oyun Basını
    {"name": "IGN", "url": "https://feeds.feedburner.com/ign/news", "category": "press"},
    {"name": "GameSpot", "url": "https://www.gamespot.com/feeds/news/", "category": "press"},
    {"name": "PCGamer", "url": "https://www.pcgamer.com/rss/", "category": "press"},
    {"name": "VGC", "url": "https://www.videogameschronicle.com/feed/", "category": "press"},
    {"name": "Bloomberg", "url": "https://www.bloomberg.com/feed/technology/", "category": "press"},
    {"name": "TurkMMO", "url": "https://www.turkmmo.com/feed/", "category": "press"},
    {"name": "Bölüm Sonu Canavarı", "url": "https://www.bolumsonucanavari.com/rss.xml", "category": "press"},
    {"name": "Merlin'in Kazanı", "url": "https://www.merlininkazani.com/rss", "category": "press"},
    
    # Insider Twitter Hesapları (Nitter RSS)
    {"name": "TezFunz2", "url": "https://nitter.perennialte.ch/TezFunz2/rss", "category": "insider"},
    {"name": "GTABase", "url": "https://nitter.perennialte.ch/GTABase/rss", "category": "insider"},
    {"name": "RockstarIntel", "url": "https://nitter.perennialte.ch/RockstarIntel/rss", "category": "insider"},
    {"name": "Yan2295", "url": "https://nitter.perennialte.ch/Yan2295/rss", "category": "insider"},
    {"name": "ZoeTheDragon", "url": "https://nitter.perennialte.ch/ZoeTheDragon/rss", "category": "insider"},
    {"name": "VideoTech_", "url": "https://nitter.perennialte.ch/VideoTech_/rss", "category": "insider"},

    # Yeni Eklenen Kaynaklar (Kullanıcı Talebi)
    # GTASeries
    {"name": "GTASeries (YouTube)", "url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCrTNhL_yO3tPTdQ5XgmmWjA", "category": "insider"},
    {"name": "GTASeries (Twitter)", "url": "https://nitter.perennialte.ch/GTASeries/rss", "category": "insider"},
    
    # SomosXbox
    {"name": "SomosXbox", "url": "https://www.somosxbox.com/feed/", "category": "press"},
    {"name": "SomosXbox (Twitter)", "url": "https://nitter.perennialte.ch/SomosXbox/rss", "category": "press"},
    
    # AlfaBetaJuega
    {"name": "AlfaBetaJuega", "url": "https://www.alfabetajuega.com/feed", "category": "press"},
    {"name": "AlfaBetaJuega (Twitter)", "url": "https://nitter.perennialte.ch/AlfaBetaJuega/rss", "category": "press"},
    
    # Viciados
    {"name": "Viciados", "url": "https://viciados.net/feed/", "category": "press"},
    {"name": "PortalViciados (Twitter)", "url": "https://nitter.perennialte.ch/PortalViciados/rss", "category": "press"},
    
    # ComboInfinito
    {"name": "ComboInfinito", "url": "https://www.comboinfinito.com.br/principal/feed/", "category": "press"},
    {"name": "ComboInfinito (Twitter)", "url": "https://nitter.perennialte.ch/comboinfinito/rss", "category": "press"},
    
    # JovemNerd
    {"name": "JovemNerd", "url": "https://jovemnerd.com.br/feed-completo", "category": "press"},
    {"name": "JovemNerd (Twitter)", "url": "https://nitter.perennialte.ch/jovemnerd/rss", "category": "press"},
]

# Anahtar Kelimeler (GTA 6, GTA VI, Rockstar, vb.)
KEYWORDS = re.compile(
    r"\bgta\b|\bgta\s*6\b|\bgta\s*vi\b|grand\s*theft\s*auto|rockstar\s*games|rockstar",
    re.IGNORECASE,
)

# =============================================
# RESİM ÇEKME HELPER (BEAUTIFUL SOUP)
# =============================================


def extract_cover_image(url: str) -> str | None:
    """Makalenin URL'inden og:image etiketini çekerek kapak görseli bulur."""
    # Nitter linkleri için doğrudan görsel çekmeyelim (genelde profil resmi veya tweet içi ek olur)
    if "nitter" in url:
        return None

    try:
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}, timeout=5)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            meta_og = soup.find("meta", property="og:image")
            if meta_og and meta_og.get("content"):
                image_url = meta_og["content"].strip()
                if image_url.startswith("http"):
                    return image_url
    except Exception as e:
        print(f"🖼️ Görsel çekilemedi: {url} | Hata: {e}")
    return None


def parse_date(entry) -> datetime | None:
    for field in ["published_parsed", "updated_parsed", "created_parsed"]:
        if field in entry and entry[field]:
            try:
                return datetime(*entry[field][:6], tzinfo=timezone.utc)
            except Exception:
                pass
    return None


# =============================================
# RSS TARAMA
# =============================================


def fetch_articles(source: dict) -> list[dict]:
    articles = []
    now = datetime.now(timezone.utc)

    try:
        # Nitter beslemelerinde timeout riskine karşı önlem
        feed = feedparser.parse(source["url"])
        print(f"📡 {source['name']} taranıyor... ({len(feed.entries)} giriş)")

        for entry in feed.entries[:20]:  # Sadece en güncel 20 habere bak
            title = entry.get("title", "")
            summary = entry.get("summary", entry.get("description", ""))
            link = entry.get("link", "")

            # 1. Anahtar kelime filtresi
            if not (KEYWORDS.search(title) or KEYWORDS.search(summary)):
                continue

            # 2. Tarih filtresi (Son 24 saat)
            published_at = parse_date(entry)
            if published_at:
                age = now - published_at
                if age > timedelta(hours=24):
                    continue

            # HTML temizliği
            clean_summary = BeautifulSoup(summary, "html.parser").get_text(strip=True)

            articles.append(
                {
                    "source_name": source["name"],
                    "source_category": source["category"],
                    "title": title.strip(),
                    "summary": clean_summary[:600],
                    "link": link.strip(),
                }
            )

    except Exception as e:
        print(f"⚠️ {source['name']} taranırken hata oluştu: {e}")

    return articles


# =============================================
# DUPLICATE FİLTRESİ
# =============================================


def filter_articles(articles: list[dict]) -> list[dict]:
    if not articles:
        return []

    client = get_client()
    new_articles = []
    recent_metadata = get_recent_news_metadata(client, hours=24)

    for article in articles:
        title = article["title"]
        link = article["link"]
        norm_title = normalize_title(title)

        if link_exists(client, link):
            continue

        if title_exists(client, norm_title):
            continue

        is_fuzzy_dup = False
        for rec in recent_metadata:
            rec_norm = rec.get("normalized_title") or normalize_title(rec.get("title", ""))
            similarity = fuzz.ratio(norm_title, rec_norm)
            if similarity >= 80:
                is_fuzzy_dup = True
                break

        if is_fuzzy_dup:
            continue

        new_articles.append(article)

    return new_articles


# =============================================
# GEMINI AI: 4 DİLDE ÇEVİRİ & GÜVENİLİRLİK SKORU
# =============================================

GEMINI_PROMPT = """You are a senior gaming editor. I am giving you a list of recently scraped GTA 6 / Rockstar news items.

Tasks:
1. Group and merge articles that report the exact same news event.
2. Filter out clickbaits or fake news.
3. Write a high-quality summary and title translated and localized in FOUR languages:
   - English (en)
   - Turkish (tr)
   - Spanish (es)
   - Portuguese (pt)
   Make the summaries detailed and natural-sounding (at least 2-3 paragraphs in each language).
4. Calculate a weighted Reliability Score (0.0 to 10.0) based on these weights:
   - Source Verification (40%): Official source (Rockstar Games) = 10, Reputable Press (IGN, Bloomberg) = 8.5, Insider (TezFunz2, GTABase) = 7.5, Gossip/Reddit = 2-3.
   - Evidence Support (30%): Screenshots, video, trailer, code files mentioned = +2 points (up to 10), speculation/text-only = no change.
   - Contradiction Check (20%): If it contradicts confirmed facts (like PS5/Xbox Series release, fall 2025 release target) = deduct 3 points.
   - Historical Consistency/Freshness (10%): If very fresh/new = 10, older rumor = 5.
   Return the final calculated float score.
5. Create relevant tags (e.g. "gta 6 map", "leak", "trailer").

You MUST return strictly a raw JSON list formatted as follows (no markdown blocks, no markdown ```json wraps, just plain JSON text):

[
  {
    "titles": {
      "en": "English Title",
      "tr": "Türkçe Başlık",
      "es": "Título en Español",
      "pt": "Título em Português"
    },
    "summaries": {
      "en": "Detailed English summary...",
      "tr": "Detaylı Türkçe özet...",
      "es": "Resumen detallado en español...",
      "pt": "Resumo detalhado em português..."
    },
    "reliability_score": 8.5,
    "tags": ["gta 6 leak", "map"],
    "sources": [
      {"name": "IGN", "url": "https://..."},
      {"name": "TezFunz2", "url": "https://..."}
    ],
    "original_links": ["https://...", "https://..."]
  }
]

Here are the news items:
"""


def process_news_with_gemini(articles: list[dict]) -> list[dict]:
    if not articles:
        return []

    if not GEMINI_API_KEY:
        print("❌ GEMINI_API_KEY bulunamadı!")
        return []

    payload = ""
    for i, art in enumerate(articles, 1):
        payload += f"\n[Haber {i}]\n"
        payload += f"Kaynak: {art['source_name']} (Kategori: {art['source_category']})\n"
        payload += f"Başlık: {art['title']}\n"
        payload += f"İçerik: {art['summary']}\n"
        payload += f"Link: {art['link']}\n"

    full_prompt = GEMINI_PROMPT + payload
    print("🤖 Gemini ile çok dilli sentezleme ve Güvenilirlik Skoru analizi başlatıldı...")

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=full_prompt,
        )

        response_text = response.text.strip()
        if response_text.startswith("```"):
            response_text = re.sub(r"^```(?:json)?\n?", "", response_text)
            response_text = re.sub(r"\n?```$", "", response_text)

        merged_news = json.loads(response_text)
        print(f"🎯 Gemini {len(merged_news)} adet birleştirilmiş çok dilli haber üretti.")
        return merged_news

    except json.JSONDecodeError as e:
        print(f"❌ JSON decode hatası: {e}")
        print(f"Gemini yanıtı: {response_text[:1000]}")
        return []
    except Exception as e:
        print(f"❌ Gemini API hatası: {e}")
        return []


def generate_embedding(client: genai.Client, text: str) -> list[float] | None:
    try:
        response = client.models.embed_content(
            model="text-embedding-004",
            contents=text,
        )
        if response.embeddings and len(response.embeddings) > 0:
            return response.embeddings[0].values
    except Exception as e:
        print(f"🧠 Embedding üretilemedi: {e}")
    return None


# =============================================
# SUPABASE'E KAYDETME
# =============================================


def save_to_supabase(merged_news: list[dict]) -> int:
    if not merged_news:
        return 0

    client = get_client()
    genai_client = genai.Client(api_key=GEMINI_API_KEY)
    saved_count = 0

    for news in merged_news:
        titles = news.get("titles", {})
        summaries = news.get("summaries", {})
        reliability_score = news.get("reliability_score", 0.0)
        tags = news.get("tags", [])
        sources = news.get("sources", [])
        original_links = news.get("original_links", [])

        # 1. og:image ile görsel çekmeyi dene
        cover_image_url = None
        for link in original_links:
            img = extract_cover_image(link)
            if img:
                cover_image_url = img
                break

        # 2. Vektörel Arama için İngilizce metni baz alarak embedding çıkar
        title_en = titles.get("en", "")
        summary_en = summaries.get("en", "")
        embedding_text = f"Title: {title_en}\nSummary: {summary_en}\nTags: {', '.join(tags)}"
        
        print(f"🧠 '{title_en[:35]}...' için embedding oluşturuluyor...")
        embedding = generate_embedding(genai_client, embedding_text)

        # 3. Supabase INSERT payload
        payload = {
            "title": titles, # JSONB {"en": "...", "tr": "..."}
            "summary": summaries, # JSONB {"en": "...", "tr": "..."}
            "normalized_title": normalize_title(title_en),
            "sources": sources,
            "original_links": original_links,
            "cover_image_url": cover_image_url,
            "reliability_score": reliability_score,
            "tags": tags,
        }

        if embedding:
            payload["embedding"] = embedding

        try:
            result = client.table("news").insert(payload).execute()
            if result.data:
                print(f"✅ Çok dilli haber kaydedildi: {title_en[:45]}...")
                saved_count += 1
        except Exception as e:
            print(f"❌ Veritabanı kayıt hatası: {e}")

    return saved_count


# =============================================
# ANA AKIŞ
# =============================================


def main():
    print("=" * 60)
    print("🎮 Zuzu RP News — Küresel Çok Dilli Scraper Başlatıldı")
    print("=" * 60)

    # 1. Tüm RSS'lerden haberleri çek
    scraped_articles = []
    for src in RSS_SOURCES:
        scraped_articles.extend(fetch_articles(src))
        time.sleep(0.5)

    if not scraped_articles:
        print("ℹ️ Eşleşen yeni haber bulunamadı.")
        return

    # 2. Tarih ve fuzzy filtreleri uygula
    filtered_articles = filter_articles(scraped_articles)

    if not filtered_articles:
        print("ℹ️ Filtreler sonucu işlenecek yeni haber kalmadı.")
        return

    # 3. Gemini ile çok dilli çeviri ve güvenilirlik analizi yap
    merged_news = process_news_with_gemini(filtered_articles)

    if not merged_news:
        print("⚠️ Gemini birleştirme sonucu boş döndü.")
        return

    # 4. Veritabanına kaydet
    saved = save_to_supabase(merged_news)

    print(f"\n{'=' * 60}")
    print(f"🎉 Tamamlandı! {saved} adet çok dilli haber veritabanına eklendi.")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
