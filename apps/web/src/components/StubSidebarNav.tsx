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
      className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"
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
                    ? "block rounded-md bg-amber-100 px-2 py-1.5 text-sm font-medium text-amber-950"
                    : "block rounded-md px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 border-t border-zinc-200 pt-3">
        <Link
          href="/"
          className="text-xs text-zinc-500 hover:text-zinc-800"
        >
          ← 練習へ
        </Link>
      </div>
    </nav>
  );
}
