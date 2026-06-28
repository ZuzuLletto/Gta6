import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const newsId = searchParams.get("newsId");
    const sortBy = searchParams.get("sortBy") || "newest"; // newest, popular, liked

    if (!newsId) {
      return NextResponse.json({ error: "newsId parametresi zorunlu." }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let query = supabase
      .from("comments")
      .select("*")
      .eq("news_id", newsId);

    // Sıralama kriteri
    if (sortBy === "newest") {
      query = query.order("created_at", { ascending: false });
    } else if (sortBy === "liked") {
      query = query.order("likes_count", { ascending: false }).order("created_at", { ascending: false });
    } else if (sortBy === "popular") {
      // Etkileşim sayısı (Likes)
      query = query.order("likes_count", { ascending: false });
    }

    const { data: comments, error } = await query;

    if (error) throw error;

    // Yorum sahipleri için dinamik rozet (badge) durumlarını ve beğenilerini çekelim
    const commentsWithBadges = await Promise.all(
      (comments || []).map(async (comment) => {
        // SQL RPC get_user_badge çağır
        const { data: badge } = await supabase.rpc("get_user_badge", {
          user_uuid: comment.user_id,
        });

        return {
          ...comment,
          badge: badge || null,
        };
      })
    );

    return NextResponse.json(commentsWithBadges);
  } catch (error: any) {
    console.error("Comments Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Auth token'ı request header'ından al
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Giriş yapılması zorunlu." }, { status: 401 });
    }

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Oturum geçersiz." }, { status: 401 });
    }

    const body = await request.json();
    const { newsId, content } = body;

    if (!newsId || !content || content.trim() === "") {
      return NextResponse.json({ error: "newsId ve content alanları zorunlu." }, { status: 400 });
    }

    // Discord profil verilerini user_metadata'dan al
    const userMetadata = user.user_metadata || {};
    const userName = userMetadata.custom_claims?.global_name || userMetadata.full_name || "Discord User";
    const userAvatar = userMetadata.avatar_url || "";

    // Yorum ekle
    const { data: newComment, error: insertError } = await supabase
      .from("comments")
      .insert({
        news_id: newsId,
        user_id: user.id,
        user_name: userName,
        user_avatar: userAvatar,
        content: content.trim(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Dinamik rozeti de dön
    const { data: badge } = await supabase.rpc("get_user_badge", {
      user_uuid: user.id,
    });

    return NextResponse.json({
      ...newComment,
      badge: badge || null,
    });
  } catch (error: any) {
    console.error("Comment Insert Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
