"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { StubNavItem } from "@/lib/stubNavConfig";

export function StubSidebarNav({
  sectionTitle,
  items,
}: {
  sectionTitle: string;
  items: readonly StubNavItem[];
}) {
  const pathname = usePathname();

  return (
    <nav
      className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
      aria-label={`${sectionTitle}内のページ`}
    >
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {sectionTitle}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  active
                    ? "block rounded-md bg-amber-950/50 px-2 py-1.5 text-sm text-amber-100"
                    : "block rounded-md px-2 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 border-t border-zinc-800 pt-3">
        <Link
          href="/"
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          ← 練習へ
        </Link>
      </div>
    </nav>
  );
}
