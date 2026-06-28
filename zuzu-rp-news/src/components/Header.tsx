"use client";

import { Gamepad2, Flame } from "lucide-react";

export default function Header() {
  return (
    <header className="relative z-10 w-full border-b border-white/5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="/" className="group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neon-pink/10 border border-neon-pink/20 transition-all group-hover:bg-neon-pink/20 group-hover:border-neon-pink/40">
              <Gamepad2 className="h-5 w-5 text-neon-pink" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-text-primary">
                GTA <span className="neon-text text-neon-pink">VI</span> Haberler
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-muted">
                Zuzu RP Topluluğu
              </span>
            </div>
          </a>

          {/* Navigation */}
          <nav className="hidden items-center gap-6 sm:flex">
            <a
              href="#haberler"
              className="flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-neon-pink"
            >
              <Flame className="h-3.5 w-3.5" />
              Son Haberler
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
