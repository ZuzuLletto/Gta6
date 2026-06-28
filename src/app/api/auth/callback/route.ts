import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // Server-side supabase client to exchange code for session
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Auth callback session exchange error:", error);
      return NextResponse.redirect(`${requestUrl.origin}/?auth_error=${encodeURIComponent(error.message)}`);
    }

    // Set cookie headers manually since we are using supabase directly, or redirect.
    // Supabase JS library handles cookies automatically in standard Next.js route handlers if using @supabase/ssr.
    // But since we are using plain @supabase/supabase-js we can construct a response with redirect
    // and rely on browser cookie headers if handled.
    // Actually, in client-side Supabase handles session exchange automatically if we use auth.onAuthStateChange.
    // However, if the server exchanges code, it gets the token. Let's redirect to 'next' with tokens in hash fragment
    // or just let the client do it.
    // Wait! A very clean way in Next.js is to redirect to the base URL, and Supabase client-side JS library will automatically
    // detect the session inside the hash fragment if we did redirect on client side, OR if we handle it on server side
    // we can return it.
    // In our callback, since we are doing Next.js App Router, we can redirect back to the page and let Supabase client handle it.
  }

  // Yönlendirme
  return NextResponse.redirect(new URL(next, request.url));
}
