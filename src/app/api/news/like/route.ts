import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Auth token doğrulama
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Giriş yapılması zorunlu." }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Oturum geçersiz." }, { status: 401 });
    }

    const body = await request.json();
    const { newsId } = body;

    if (!newsId) {
      return NextResponse.json({ error: "newsId alanı zorunlu." }, { status: 400 });
    }

    // Kullanıcının daha önce beğenip beğenmediğini kontrol et
    const { data: existingLike } = await supabase
      .from("news_likes")
      .select("*")
      .eq("news_id", newsId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingLike) {
      // Beğeniyi geri çek (Unlike)
      const { error: deleteError } = await supabase
        .from("news_likes")
        .delete()
        .eq("news_id", newsId)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      return NextResponse.json({ liked: false });
    } else {
      // Beğen (Like)
      const { error: insertError } = await supabase
        .from("news_likes")
        .insert({
          news_id: newsId,
          user_id: user.id,
        });

      if (insertError) throw insertError;

      return NextResponse.json({ liked: true });
    }
  } catch (error: any) {
    console.error("News Like Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
