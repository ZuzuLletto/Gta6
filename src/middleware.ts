import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["en", "tr", "es", "pt"];
const defaultLocale = "en";

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get("accept-language");
  if (!acceptLanguage) return defaultLocale;

  // Accept-language: tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7
  const preferredLocales = acceptLanguage
    .split(",")
    .map((lang) => lang.split(";")[0].trim().split("-")[0].toLowerCase());

  for (const locale of preferredLocales) {
    if (locales.includes(locale)) {
      return locale;
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Next.js static asset'leri, public resimleri ve API uç noktalarını hariç tut
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".") // logo.png, vb. uzantılı dosyalar
  ) {
    return;
  }

  // Pathname'in desteklenen dillerden biriyle başlayıp başlamadığını kontrol et
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Eşleşen dil yoksa, Accept-Language'a göre tespit et ve redirect et
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Statik dosyaları filtrelemek için matcher
  matcher: ["/((?!_next/static|_next/image|assets|favicon.ico|sw.js).*)"],
};
