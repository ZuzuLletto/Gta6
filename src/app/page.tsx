import { redirect } from "next/navigation";

// Kök path '/' tetiklendiğinde varsayılan olarak İngilizceye yönlendirir.
// Middleware.ts tarayıcı diline göre otomatik yönlendirme yapar,
// bu sayfa ise build aşamalarında ve middleware fallback durumlarında çalışır.
export default function RootPage() {
  redirect("/en");
}
