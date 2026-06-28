import { redirect } from "next/navigation";

import { sidebarLinks } from "@/config/dashboard";
import { getCurrentUser } from "@/lib/session";
import { OrgProvider } from "@/contexts/org-context";
import { SearchCommand } from "@/components/dashboard/search-command";
import { OrgSwitcher } from "@/components/dashboard/org-switcher";
import {
  DashboardSidebar,
  MobileSheetSidebar,
} from "@/components/layout/dashboard-sidebar";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { UserAccountNav } from "@/components/layout/user-account-nav";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function Dashboard({ children }: ProtectedLayoutProps) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ""
  const token = user.accessToken ?? ""
  let isSuperuser = false
  if (token) {
    try {
      const meRes = await fetch(`${apiUrl}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      if (meRes.ok) {
        const me = await meRes.json()
        isSuperuser = me.is_superuser === true
      }
    } catch {}
  }

  const filteredLinks = sidebarLinks.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.superadminOnly && !isSuperuser) return false
      if (item.authorizeOnly && item.authorizeOnly !== user.role) return false
      return true
    }),
  }));

  return (
    <OrgProvider>
    <div className="relative flex min-h-screen w-full">
      <DashboardSidebar links={filteredLinks} />

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-50 flex h-14 bg-background px-4 lg:h-[60px] xl:px-8">
          <MaxWidthWrapper className="flex max-w-7xl items-center gap-x-3 px-0">
            <MobileSheetSidebar links={filteredLinks} />

            <div className="w-full flex-1">
              <SearchCommand links={filteredLinks} />
            </div>

            <div className="md:hidden">
              <OrgSwitcher />
            </div>
            <ModeToggle />
            <UserAccountNav />
          </MaxWidthWrapper>
        </header>

        <main className="flex-1 p-4 xl:px-8">
          <MaxWidthWrapper className="flex h-full max-w-7xl flex-col gap-4 px-0 lg:gap-6">
            {children}
          </MaxWidthWrapper>
        </main>
      </div>
    </div>
    </OrgProvider>
  );
}
