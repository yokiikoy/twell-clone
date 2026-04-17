"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  NAV_CHARTS,
  NAV_RECORD,
  NAV_SETTINGS,
  NAV_SYSTEM,
  TW_FAN_URL,
  type StubNavItem,
} from "@/lib/stubNavConfig";
import { KeyGuideDialog } from "./KeyGuideDialog";

type MenuId = "record" | "settings" | "charts" | "system" | "help";

function NavMenu({
  id,
  label,
  items,
  menuOpen,
  setMenuOpen,
}: {
  id: MenuId;
  label: string;
  items: readonly StubNavItem[];
  menuOpen: MenuId | null;
  setMenuOpen: (v: MenuId | null) => void;
}) {
  const open = menuOpen === id;
  const btnId = useId();
  const listId = `${btnId}-list`;

  return (
    <div className="relative">
      <button
        id={btnId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={listId}
        className="flex cursor-pointer items-center rounded-md px-2 py-1.5 text-sm text-zinc-300 outline-none ring-zinc-600 hover:bg-zinc-800 hover:text-zinc-100 data-[open=true]:bg-zinc-800"
        data-open={open}
        onClick={() => setMenuOpen(open ? null : id)}
      >
        {label}
        <span className="ml-1 text-zinc-500" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="menu"
          aria-labelledby={btnId}
          className="absolute left-0 top-full z-40 mt-1 min-w-[12rem] rounded-md border border-zinc-700 bg-zinc-950 py-1 shadow-lg"
        >
          {items.map((item) => (
            <li key={item.href} role="none">
              <Link
                role="menuitem"
                href={item.href}
                className="block px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                onClick={() => setMenuOpen(null)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [keyGuideOpen, setKeyGuideOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<MenuId | null>(null);
  const headerNavRef = useRef<HTMLElement>(null);

  const closeMenus = useCallback(() => setMenuOpen(null), []);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = headerNavRef.current;
      if (!el?.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const helpBtnId = useId();
  const helpListId = `${helpBtnId}-help`;
  const helpOpen = menuOpen === "help";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <nav
          ref={headerNavRef}
          className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-3 py-2 sm:gap-2 sm:px-4"
          aria-label="メイン"
        >
          <Link
            href="/"
            className="mr-2 rounded-md px-2 py-1.5 text-sm font-medium text-amber-100/90 hover:bg-zinc-800"
            onClick={closeMenus}
          >
            練習
          </Link>
          <NavMenu
            id="record"
            label="記録"
            items={NAV_RECORD}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />
          <NavMenu
            id="settings"
            label="設定"
            items={NAV_SETTINGS}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />
          <NavMenu
            id="charts"
            label="チャート"
            items={NAV_CHARTS}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />
          <Link
            href="/tools/heavy-user"
            className="rounded-md px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            onClick={closeMenus}
          >
            ヘビーユーザー
          </Link>
          <NavMenu
            id="system"
            label="システム"
            items={NAV_SYSTEM}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />
          <div className="relative">
            <button
              id={helpBtnId}
              type="button"
              aria-haspopup="menu"
              aria-expanded={helpOpen}
              aria-controls={helpListId}
              className="flex cursor-pointer items-center rounded-md px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 data-[open=true]:bg-zinc-800"
              data-open={helpOpen}
              onClick={() => setMenuOpen(helpOpen ? null : "help")}
            >
              ヘルプ
              <span className="ml-1 text-zinc-500" aria-hidden>
                ▾
              </span>
            </button>
            {helpOpen ? (
              <ul
                id={helpListId}
                role="menu"
                aria-labelledby={helpBtnId}
                className="absolute left-0 top-full z-40 mt-1 min-w-[11rem] rounded-md border border-zinc-700 bg-zinc-950 py-1 shadow-lg"
              >
                <li role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                    onClick={() => {
                      setKeyGuideOpen(true);
                      setMenuOpen(null);
                    }}
                  >
                    キーのガイド
                  </button>
                </li>
                <li role="none">
                  <Link
                    role="menuitem"
                    href="/help/readme"
                    className="block px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                    onClick={() => setMenuOpen(null)}
                  >
                    ReadMe 相当
                  </Link>
                </li>
                <li role="none">
                  <a
                    role="menuitem"
                    href={TW_FAN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                    onClick={() => setMenuOpen(null)}
                  >
                    公式サイト（別タブ）
                  </a>
                </li>
              </ul>
            ) : null}
          </div>
        </nav>
      </header>
      <div className="flex-1">{children}</div>
      <KeyGuideDialog
        open={keyGuideOpen}
        onClose={() => setKeyGuideOpen(false)}
      />
    </div>
  );
}
