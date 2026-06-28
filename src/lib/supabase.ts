import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tüm haberleri en yeniden en eskiye getir
export async function fetchNews() {
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase fetch error:", error);
    return [];
  }

  return data;
}

// Belirli bir linkin daha önce kaydedilip kaydedilmediğini kontrol et
export async function linkExists(link: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("news")
    .select("id")
    .contains("original_links", [link])
    .limit(1);

  if (error) {
    console.error("Link check error:", error);
    return false;
  }

  return data.length > 0;
}
