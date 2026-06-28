import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const geminiApiKey = process.env.GEMINI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim() === "") {
      return NextResponse.json([]);
    }

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY sunucuda tanımlanmamış." },
        { status: 500 }
      ) as Response; // explicit casting to satisfy type checker if needed
    }

    // 1. Google GenAI SDK ile sorgu metninin anlam vektörünü (embedding) çıkar
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: query,
    });

    const embedding = response.embeddings?.[0]?.values;

    if (!embedding) {
      throw new Error("Embedding üretilemedi.");
    }

    // 2. Supabase RPC 'search_news' fonksiyonunu çağır
    const { data: searchResults, error } = await supabase.rpc("search_news", {
      query_embedding: embedding,
      match_threshold: 0.3, // Anlamsal benzerlik eşiği (%30)
      match_count: 5, // En benzer 5 haber
    });

    if (error) {
      console.error("Supabase RPC error:", error);
      throw error;
    }

    return NextResponse.json(searchResults || []);
  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { error: error.message || "Arama sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}
