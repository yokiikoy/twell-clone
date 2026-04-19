import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { AutomatonInputRoot } from "@/lib/AutomatonInputRoot";
import "./globals.css";

export const metadata: Metadata = {
  title: "Typewell JR clone (private)",
  description: "Practice typing — Linux-friendly web prototype",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased text-zinc-900">
        <AutomatonInputRoot>
          <AppShell>{children}</AppShell>
        </AutomatonInputRoot>
      </body>
    </html>
  );
}
