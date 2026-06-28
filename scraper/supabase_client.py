import os
import re
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client

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

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


def get_client() -> Client:
    """Supabase service role client oluşturur (yazma yetkili)."""
    url = os.environ.get("SUPABASE_URL", SUPABASE_URL)
    key = os.environ.get("SUPABASE_SERVICE_KEY", SUPABASE_SERVICE_KEY)
    if not url or not key:
        raise ValueError(
            "SUPABASE_URL ve SUPABASE_SERVICE_KEY ortam değişkenleri tanımlanmalı."
        )
    return create_client(url, key)


def normalize_title(title: str) -> str:
    """Başlığı fuzzy matching ve tam eşleşme için normalize eder."""
    if not title:
        return ""
    title = title.lower()
    # Türkçe karakter dönüşümleri
    turkish_map = {
        "ı": "i",
        "ğ": "g",
        "ü": "u",
        "ş": "s",
        "ö": "o",
        "ç": "c",
        "â": "a",
        "î": "i",
        "û": "u",
    }
    for char, replacement in turkish_map.items():
        title = title.replace(char, replacement)
    # Alfanümerik dışı karakterleri kaldır ve boşlukları temizle
    title = re.sub(r"[^a-z0-9\s]", "", title)
    title = re.sub(r"\s+", " ", title).strip()
    return title


def link_exists(client: Client, link: str) -> bool:
    """Bir haber linkinin daha önce kaydedilip kaydedilmediğini kontrol eder."""
    result = (
        client.table("news")
        .select("id")
        .contains("original_links", [link])
        .limit(1)
        .execute()
    )
    return len(result.data) > 0


def title_exists(client: Client, norm_title: str) -> bool:
    """Bir başlığın veritabanında tam eşleşip eşleşmediğini kontrol eder."""
    if not norm_title:
        return False
    result = (
        client.table("news")
        .select("id")
        .eq("normalized_title", norm_title)
        .limit(1)
        .execute()
    )
    return len(result.data) > 0


def get_recent_news_metadata(client: Client, hours: int = 24) -> list[dict]:
    """Son X saatte eklenen haberlerin başlıklarını ve normalize başlıklarını getirir (fuzzy matching için)."""
    time_threshold = (
        datetime.now(timezone.utc) - timedelta(hours=hours)
    ).isoformat()
    # Çok dilli yapıda titles bir JSONB olduğu için en dildeki başlığı arayalım.
    # Postgres'te `title->>'en'` şeklinde de aranabilir ama supabase postgrest client'ında direct text cast de yapılabilir.
    # Biz 'normalized_title' alanını doğrudan veritabanında sakladığımız için
    # normalized_title'ı select etmek fuzzy matching için yeterlidir.
    result = (
        client.table("news")
        .select("normalized_title")
        .gte("created_at", time_threshold)
        .execute()
    )
    return result.data if result.data else []


def insert_news(
    client: Client,
    title: dict, # Çok dilli: {"en": "...", "tr": "..."}
    summary: dict, # Çok dilli: {"en": "...", "tr": "..."}
    sources: list[dict],
    original_links: list[str],
    cover_image_url: str | None = None,
    embedding: list[float] | None = None,
    reliability_score: float = 0.0,
    tags: list[str] = [],
) -> dict | None:
    """Çok dilli haberi ve tüm metadata alanlarını anlam vektörü ile kaydeder."""
    title_en = title.get("en", "")
    norm_title = normalize_title(title_en)
    
    payload = {
        "title": title,
        "summary": summary,
        "normalized_title": norm_title,
        "sources": sources,
        "original_links": original_links,
        "cover_image_url": cover_image_url,
        "reliability_score": reliability_score,
        "tags": tags,
    }

    if embedding:
        payload["embedding"] = embedding

    result = client.table("news").insert(payload).execute()

    if result.data:
        print(f"✅ Haber eklendi: {title_en[:60]}...")
        return result.data[0]
    else:
        print(f"❌ Haber eklenemedi: {title_en[:60]}...")
        return None
