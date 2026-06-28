"use client";

import { MessageCircle } from "lucide-react";

const DISCORD_INVITE_URL = "https://discord.gg/zuzurp"; // Placeholder — gerçek link ile değiştirin

export default function DiscordButton() {
  return (
    <a
      href={DISCORD_INVITE_URL}
      target="_blank"
      rel="noopener noreferrer"
      id="discord-join-button"
      className="fixed right-5 top-5 z-50 flex items-center gap-2 rounded-full bg-neon-pink px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-neon-pink-soft animate-pulse-glow"
    >
      <MessageCircle className="h-4 w-4" />
      <span className="hidden sm:inline">Zuzu RP&apos;ye Katıl</span>
      <span className="sm:hidden">Katıl</span>
    </a>
  );
}
