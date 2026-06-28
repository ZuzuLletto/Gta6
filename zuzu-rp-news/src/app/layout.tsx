import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "GTA VI Haberler | Zuzu RP — Tüm GTA 6 Haberleri Tek Yerde",
  description:
    "GTA 6 hakkında en güncel haberler, sızıntılar ve duyurular. Türkçe kaynaklardan derlenen GTA VI haberleri ve Zuzu RP topluluğu.",
  keywords: [
    "GTA 6",
    "GTA VI",
    "GTA 6 haberler",
    "GTA 6 çıkış tarihi",
    "Zuzu RP",
    "GTA 6 Türkçe",
    "Rockstar Games",
  ],
  openGraph: {
    title: "GTA VI Haberler | Zuzu RP",
    description:
      "GTA 6 hakkında en güncel haberler, sızıntılar ve duyurular. Zuzu RP topluluğuna katıl!",
    type: "website",
    locale: "tr_TR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${outfit.variable} h-full antialiased`}>
      <body className="relative min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
