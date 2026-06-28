import Header from "@/components/Header";
import NewsCard from "@/components/NewsCard";
import DiscordButton from "@/components/DiscordButton";
import { Newspaper, Zap } from "lucide-react";

// Mock data — Supabase bağlandığında kaldırılacak
const MOCK_NEWS = [
  {
    id: "1",
    title: "GTA 6 İlk Resmi Oynanış Görüntüleri Sızdırıldı — Rockstar Games Sessizliğini Koruyor",
    summary:
      "Birden fazla kaynağın doğruladığı bilgilere göre, GTA 6'nın oynanış mekaniklerine ait ekran görüntüleri internete sızdı. Görüntülerde Vice City'nin gece hayatı, araç modifikasyonları ve yeni NPC etkileşim sistemleri dikkat çekiyor. Rockstar Games henüz resmi bir açıklama yapmadı, ancak Take-Two Interactive'in telif hakkı talepleri görüntülerin gerçek olduğunu işaret ediyor.",
    sources: [
      { name: "DonanımHaber", url: "https://donanimhaber.com" },
      { name: "Webtekno", url: "https://webtekno.com" },
      { name: "ShiftDelete", url: "https://shiftdelete.net" },
    ],
    original_links: [],
    cover_image_url: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 saat önce
  },
  {
    id: "2",
    title: "GTA 6 Haritası Vice City'nin 3 Katı Büyüklüğünde Olacak",
    summary:
      "Son gelişmelere göre GTA 6'nın açık dünyası, GTA V'in Los Santos haritasından bile büyük olacak. Harita üzerinde birden fazla ada, bataklık alanları ve şehir merkezleri yer alacak. Jason Schreier'ın Bloomberg'deki röportajına göre Rockstar, haritayı oyun çıktıktan sonra da genişletmeyi planlıyor.",
    sources: [
      { name: "GZT", url: "https://gzt.com" },
      { name: "DonanımHaber", url: "https://donanimhaber.com" },
    ],
    original_links: [],
    cover_image_url: null,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 saat önce
  },
  {
    id: "3",
    title: "Take-Two CEO'su GTA 6 Çıkış Tarihini Teyit Etti: 2025 Sonbahar",
    summary:
      "Take-Two Interactive'in son yatırımcı toplantısında CEO Strauss Zelnick, GTA 6'nın 2025 yılı sonbahar döneminde piyasaya çıkacağını bir kez daha doğruladı. Zelnick, 'Bu oyun, eğlence tarihinin en büyük lansmanlarından biri olacak' dedi. Analistler ilk hafta satışlarının 1 milyar doları aşacağını öngörüyor.",
    sources: [
      { name: "Webtekno", url: "https://webtekno.com" },
      { name: "ShiftDelete", url: "https://shiftdelete.net" },
      { name: "Bloomberg", url: "https://bloomberg.com" },
    ],
    original_links: [],
    cover_image_url: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 gün önce
  },
  {
    id: "4",
    title: "GTA 6 Online Mod Sistemi Kökten Değişiyor — Yeni Detaylar",
    summary:
      "Rockstar Games'in GTA 6 Online için tamamen yenilenen bir ekonomik sistem ve mod desteği üzerinde çalıştığı ortaya çıktı. Yeni sistemde oyuncular kendi işletmelerini kurabilecek, gayrimenkul alım-satımı yapabilecek ve diğer oyuncularla ticaret yapabilecek. Ayrıca rol yapma (RP) sunucuları için resmi mod desteği de planlanıyor.",
    sources: [
      { name: "DonanımHaber", url: "https://donanimhaber.com" },
      { name: "GZT", url: "https://gzt.com" },
    ],
    original_links: [],
    cover_image_url: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 gün önce
  },
  {
    id: "5",
    title: "Vice City'nin Hava Durumu Sistemi Oyun Dünyasında Bir İlk Olacak",
    summary:
      "GTA 6'da gerçek zamanlı hava durumu motoru kullanılacağı bildirildi. Kasırgalar, tropikal fırtınalar ve güneş batımları fizik tabanlı bulut sistemiyle render edilecek. Bu sistem, oyun dünyasındaki NPC davranışlarını ve trafik akışını da doğrudan etkileyecek. Rockstar'ın bu teknoloji için ayrı bir ekip kurduğu iddia ediliyor.",
    sources: [
      { name: "Webtekno", url: "https://webtekno.com" },
      { name: "ShiftDelete", url: "https://shiftdelete.net" },
    ],
    original_links: [],
    cover_image_url: null,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 gün önce
  },
];

export default function Home() {
  return (
    <>
      <DiscordButton />
      <Header />

      <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neon-pink/20 bg-neon-pink/5 px-4 py-1.5 text-xs font-medium text-neon-pink">
            <Zap className="h-3 w-3" />
            Canlı Haber Akışı
          </div>
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
            Tüm <span className="neon-text text-neon-pink">GTA VI</span> Haberleri
            <br />
            <span className="text-text-secondary">Tek Yerde.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
            Türkiye&apos;nin en popüler teknoloji sitelerinden derlenen GTA 6
            haberleri, yapay zeka ile birleştirilerek size sunuluyor.
          </p>
        </section>

        {/* News Section */}
        <section id="haberler">
          <div className="mb-6 flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-neon-pink" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Son Haberler
            </h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <div className="grid gap-5">
            {MOCK_NEWS.map((news) => (
              <NewsCard
                key={news.id}
                title={news.title}
                summary={news.summary}
                sources={news.sources}
                coverImageUrl={news.cover_image_url}
                createdAt={news.created_at}
              />
            ))}
          </div>
        </section>

        {/* Zuzu RP CTA Section */}
        <section className="mt-12 mb-8 text-center">
          <div className="glass-card p-8 sm:p-10">
            <h3 className="mb-3 text-2xl font-bold text-text-primary sm:text-3xl">
              <span className="neon-text text-neon-pink">Zuzu RP</span> Çok Yakında!
            </h3>
            <p className="mx-auto mb-5 max-w-lg text-sm text-text-secondary">
              GTA 6 çıktığında Türkiye&apos;nin en büyük RP sunucusunda yerini al.
              Discord&apos;a katıl, erkenden topluluğun bir parçası ol.
            </p>
            <a
              href="https://discord.gg/zuzurp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-neon-pink px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-105 hover:bg-neon-pink-soft"
            >
              Discord&apos;a Katıl →
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-xs text-text-muted">
        <p>
          © {new Date().getFullYear()} Zuzu RP — GTA VI haberleri yapay zeka ile
          derlenmektedir.
        </p>
      </footer>
    </>
  );
}
