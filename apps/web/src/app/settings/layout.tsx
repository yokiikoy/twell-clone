import { StubSidebarNav } from "@/components/StubSidebarNav";
import { NAV_SETTINGS } from "@/lib/stubNavConfig";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:flex-row sm:gap-10">
      <aside className="shrink-0 sm:w-52">
        <div className="sm:sticky sm:top-20">
          <StubSidebarNav sectionTitle="設定" items={NAV_SETTINGS} />
        </div>
      </aside>
      <div className="min-w-0 flex-1 border-t border-zinc-800 pt-4 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
        {children}
      </div>
    </div>
  );
}
