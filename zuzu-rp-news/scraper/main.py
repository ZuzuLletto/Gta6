"""
Zuzu RP News — GTA 6 Haber Scraper + Gemini AI Birleştirici

Algoritma:
1. Belirlenen Türkçe haber sitelerinin RSS/HTML'ini tarar
2. "GTA 6" veya "GTA VI" geçen haberleri toplar
3. Daha önce kaydedilmiş linkleri atlar (duplicate koruması)
4. Yeni haberleri Gemini 1.5 Flash'a gönderip birleştirilmiş özet alır
5. Sonuçları Supabase'e kaydeder
"""

import os
import re
import json
import time
import feedparser
import requests
from bs4 import BeautifulSoup
from google import genai
from supabase_client import get_client, link_exists, insert_news

# =============================================
# YAPILANDIRMA
# =============================================

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Taranacak RSS kaynakları
RSS_SOURCES = [
    {
        "name": "DonanımHaber",
        "url": "https://www.donanimhaber.com/rss/tum/",
        "type": "rss",
    },
    {
        "name": "Webtekno",
        "url": "https://www.webtekno.com/rss.xml",
        "type": "rss",
    },
    {
        "name": "ShiftDelete",
        "url": "https://shiftdelete.net/feed",
        "type": "rss",
    },
    {
        "name": "Technopat",
        "url": "https://www.technopat.net/feed/",
        "type": "rss",
    },
]

# GTA 6 ile ilgili anahtar kelimeler (case-insensitive)
GTA6_KEYWORDS = re.compile(
    r"gta\s*6|gta\s*vi|grand\s*theft\s*auto\s*6|grand\s*theft\s*auto\s*vi|rockstar\s*games.*vice|vice\s*city.*rockstar",
    re.IGNORECASE,
)


# =============================================
# HABER TOPLAMA
# =============================================


def fetch_rss_articles(source: dict) -> list[dict]:
    """Bir RSS kaynağından GTA 6 ile ilgili haberleri toplar."""
    articles = []

    try:
        feed = feedparser.parse(source["url"])

        for entry in feed.entries[:30]:  # Son 30 girişe bak
            title = entry.get("title", "")
            summary = entry.get("summary", entry.get("description", ""))
            link = entry.get("link", "")

            # GTA 6 filtresi
            if GTA6_KEYWORDS.search(title) or GTA6_KEYWORDS.search(summary):
                # HTML etiketlerini temizle
                clean_summary = BeautifulSoup(summary, "html.parser").get_text(
                    strip=True
                )

                articles.append(
                    {
                        "source_name": source["name"],
                        "title": title.strip(),
                        "summary": clean_summary[:500],  # Max 500 karakter
                        "link": link.strip(),
                    }
                )

        print(
            f"📰 {source['name']}: {len(articles)} GTA 6 haberi bulundu"
        )

    except Exception as e:
        print(f"⚠️ {source['name']} taranırken hata: {e}")

    return articles


def collect_all_articles() -> list[dict]:
    """Tüm kaynaklardan GTA 6 haberlerini toplar."""
    all_articles = []

    for source in RSS_SOURCES:
        articles = fetch_rss_articles(source)
        all_articles.extend(articles)
        time.sleep(1)  # Rate limiting — sitelere saygılı ol

    print(f"\n📊 Toplam {len(all_articles)} GTA 6 haberi toplandı.")
    return all_articles


# =============================================
# DUPLICATE FİLTRELEME
# =============================================


def filter_new_articles(articles: list[dict]) -> list[dict]:
    """Supabase'de zaten var olan linkleri filtreler."""
    client = get_client()
    new_articles = []

    for article in articles:
        if not link_exists(client, article["link"]):
            new_articles.append(article)
        else:
            print(f"🔄 Zaten var, atlanıyor: {article['title'][:50]}...")

    print(f"🆕 {len(new_articles)} yeni haber bulundu.\n")
    return new_articles


# =============================================
# GEMINİ AI BİRLEŞTİRME
# =============================================

GEMINI_PROMPT = """Sana farklı Türkçe haber sitelerinden toplanan GTA 6 ile ilgili haber metinleri veriyorum.

Görevin:
1. Aynı olayı anlatan haberleri birleştir.
2. Her bir benzersiz olay için tek bir akıcı Türkçe özet çıkar.
3. Orijinal siteleri "kaynaklar" dizisine ekle.
4. Eğer haberlerin içinde bir görsel URL'i varsa onu da ekle, yoksa null yaz.

Çıktıyı SADECE aşağıdaki JSON formatında ver, başka hiçbir şey yazma:

[
  {
    "baslik": "Birleştirilmiş haber başlığı",
    "ozet": "Detaylı ve akıcı Türkçe özet (en az 2-3 paragraf)",
    "kaynaklar": [
      {"name": "Site Adı", "url": "https://..."}
    ],
    "original_links": ["https://link1", "https://link2"],
    "kapak_resmi_url": null
  }
]

İşte haberler:

"""


def merge_with_gemini(articles: list[dict]) -> list[dict]:
    """Haberleri Gemini 1.5 Flash ile birleştirir."""
    if not articles:
        print("ℹ️ Birleştirilecek haber yok.")
        return []

    if not GEMINI_API_KEY:
        print("❌ GEMINI_API_KEY ortam değişkeni tanımlanmamış!")
        return []

    # Haber metinlerini hazırla
    news_text = ""
    for i, article in enumerate(articles, 1):
        news_text += f"\n--- Haber {i} ---\n"
        news_text += f"Kaynak: {article['source_name']}\n"
        news_text += f"Başlık: {article['title']}\n"
        news_text += f"Özet: {article['summary']}\n"
        news_text += f"Link: {article['link']}\n"

    full_prompt = GEMINI_PROMPT + news_text

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=full_prompt,
        )

        # JSON yanıtı parse et
        response_text = response.text.strip()

        # Markdown code block varsa temizle
        if response_text.startswith("```"):
            response_text = re.sub(r"^```(?:json)?\n?", "", response_text)
            response_text = re.sub(r"\n?```$", "", response_text)

        merged = json.loads(response_text)
        print(f"🤖 Gemini {len(merged)} birleştirilmiş haber üretti.")
        return merged

    except json.JSONDecodeError as e:
        print(f"❌ Gemini JSON parse hatası: {e}")
        print(f"Ham yanıt: {response_text[:500]}")
        return []
    except Exception as e:
        print(f"❌ Gemini API hatası: {e}")
        return []


# =============================================
# VERİTABANINA KAYDETME
# =============================================


def save_to_supabase(merged_news: list[dict]) -> int:
    """Birleştirilmiş haberleri Supabase'e kaydeder."""
    if not merged_news:
        return 0

    client = get_client()
    saved_count = 0

    for news in merged_news:
        result = insert_news(
            client=client,
            title=news.get("baslik", ""),
            summary=news.get("ozet", ""),
            sources=news.get("kaynaklar", []),
            original_links=news.get("original_links", []),
            cover_image_url=news.get("kapak_resmi_url"),
        )
        if result:
            saved_count += 1

    return saved_count


# =============================================
# ANA AKIŞ
# =============================================


def main():
    print("=" * 50)
    print("🎮 Zuzu RP News — GTA 6 Haber Scraper Başlatıldı")
    print("=" * 50)

    # 1. Tüm kaynaklardan haber topla
    all_articles = collect_all_articles()

    if not all_articles:
        print("ℹ️ Hiç GTA 6 haberi bulunamadı. Çıkılıyor.")
        return

    # 2. Duplicate linkleri filtrele
    new_articles = filter_new_articles(all_articles)

    if not new_articles:
        print("ℹ️ Tüm haberler zaten mevcut. Çıkılıyor.")
        return

    # 3. Gemini ile birleştir
    merged_news = merge_with_gemini(new_articles)

    if not merged_news:
        print("⚠️ Gemini birleştirme sonuç vermedi. Çıkılıyor.")
        return

    # 4. Supabase'e kaydet
    saved = save_to_supabase(merged_news)

    print(f"\n{'=' * 50}")
    print(f"✅ Tamamlandı! {saved} yeni haber kaydedildi.")
    print(f"{'=' * 50}")


if __name__ == "__main__":
    main()
