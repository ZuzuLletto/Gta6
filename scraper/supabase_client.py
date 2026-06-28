import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


def get_client() -> Client:
    """Supabase service role client oluşturur (yazma yetkili)."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError(
            "SUPABASE_URL ve SUPABASE_SERVICE_KEY ortam değişkenleri tanımlanmalı."
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


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


def insert_news(
    client: Client,
    title: str,
    summary: str,
    sources: list[dict],
    original_links: list[str],
    cover_image_url: str | None = None,
) -> dict | None:
    """Birleştirilmiş haberi news tablosuna ekler."""
    payload = {
        "title": title,
        "summary": summary,
        "sources": sources,
        "original_links": original_links,
        "cover_image_url": cover_image_url,
    }

    result = client.table("news").insert(payload).execute()

    if result.data:
        print(f"✅ Haber eklendi: {title[:60]}...")
        return result.data[0]
    else:
        print(f"❌ Haber eklenemedi: {title[:60]}...")
        return None
