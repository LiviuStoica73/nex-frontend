"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation"
// usePathname + useSearchParams sunt folosite în hook-ul useIsActive de mai jos
import { useTranslations } from "next-intl";
import { NavItem, SidebarNavItem } from "@/types";
import { Menu, PanelLeftClose, PanelRightClose } from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UpgradeCard } from "@/components/dashboard/upgrade-card";
import { OrgSwitcher } from "@/components/dashboard/org-switcher";
import { Icons } from "@/components/shared/icons";
import { useOrg } from "@/contexts/org-context";
import {
  translateSidebarItemTitle,
  translateSidebarSectionTitle,
} from "@/lib/i18n-navigation"
import { Plus } from "lucide-react";

interface DashboardSidebarProps {
  links: SidebarNavItem[];
}

function useIsActive() {
  const path = usePathname();
  const searchParams = useSearchParams();
  return (href: string) => {
    const [hrefPath, hrefQuery] = href.split("?")
    if (path !== hrefPath) return false
    if (!hrefQuery) return !searchParams.get("tab") || hrefPath !== "/dashboard/intelligence"
    const tab = new URLSearchParams(hrefQuery).get("tab")
    return searchParams.get("tab") === tab
  }
}

export function DashboardSidebar({ links }: DashboardSidebarProps) {
  const t = useTranslations();
  const { activeOrg } = useOrg();
  const isActive = useIsActive();
  const isAgency = activeOrg?.is_agency ?? false;

  // NOTE: Use this if you want save in local storage -- Credits: Hosna Qasmei
  //
  // const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
  //   if (typeof window !== "undefined") {
  //     const saved = window.localStorage.getItem("sidebarExpanded");
  //     return saved !== null ? JSON.parse(saved) : true;
  //   }
  //   return true;
  // });

  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     window.localStorage.setItem(
  //       "sidebarExpanded",
  //       JSON.stringify(isSidebarExpanded),
  //     );
  //   }
  // }, [isSidebarExpanded]);

  const { isTablet } = useMediaQuery();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(!isTablet);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  useEffect(() => {
    setIsSidebarExpanded(!isTablet);
  }, [isTablet]);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="sticky top-0 h-full">
        <ScrollArea className="h-full overflow-y-auto border-r">
          <aside
            className={cn(
              isSidebarExpanded ? "w-[220px] xl:w-[260px]" : "w-[68px]",
              "hidden h-screen md:block",
            )}
          >
            <div className="flex h-full max-h-screen flex-1 flex-col gap-2">
              <div className="flex h-14 items-center p-4 lg:h-[60px]">
                {isSidebarExpanded ? (
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <img src="/nex-nex-logo.svg" alt="Nex-Nex logo" className="size-8 flex-shrink-0" />
                    <img src="/nex-nex-sign.svg" alt="Nex-Nex" className="h-5 w-auto" />
                  </Link>
                ) : (
                  <Link href="/dashboard">
                    <img src="/nex-nex-logo.svg" alt="Nex-Nex logo" className="size-8" />
                  </Link>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto size-9 lg:size-8"
                  onClick={toggleSidebar}
                >
                  {isSidebarExpanded ? (
                    <PanelLeftClose
                      size={18}
                      className="stroke-muted-foreground"
                    />
                  ) : (
                    <PanelRightClose
                      size={18}
                      className="stroke-muted-foreground"
                    />
                  )}
                  <span className="sr-only">{t("common.toggle_sidebar")}</span>
                </Button>
              </div>

              <div className="px-2 pb-2 border-b mb-2">
                <OrgSwitcher />
              </div>

              {isSidebarExpanded ? (
                <div className="px-3 pb-2">
                  <Link
                    href="/dashboard/intelligence?tab=opportunities&new=true"
                    className="flex items-center justify-center gap-2 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Crează postare
                  </Link>
                </div>
              ) : (
                <div className="px-2 pb-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href="/dashboard/intelligence?tab=opportunities&new=true"
                        className="flex items-center justify-center w-full rounded-md bg-primary p-2 text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">Crează postare</TooltipContent>
                  </Tooltip>
                </div>
              )}

              <nav className="flex flex-1 flex-col gap-8 px-4 pt-4">
                {links.map((section) => {
                  const visibleItems = section.items.filter(
                    (item) => !item.agencyOnly || isAgency
                  )
                  if (visibleItems.length === 0) return null
                  return (
                  <section
                    key={section.title}
                    className="flex flex-col gap-0.5"
                  >
                    {isSidebarExpanded ? (
                      <p className="text-xs text-muted-foreground">
                        {translateSidebarSectionTitle(section.title, t)}
                      </p>
                    ) : (
                      <div className="h-4" />
                    )}
                    {visibleItems.map((item) => {
                      const Icon = Icons[item.icon || "arrowRight"];
                      return (
                        item.href && (
                          <Fragment key={`link-fragment-${item.title}`}>
                            {isSidebarExpanded ? (
                              <Link
                                key={`link-${item.title}`}
                                href={item.disabled ? "#" : item.href}
                                className={cn(
                                  "flex items-center gap-3 rounded-md p-2 text-sm font-medium hover:bg-muted",
                                  isActive(item.href)
                                    ? "bg-muted"
                                    : "text-muted-foreground hover:text-accent-foreground",
                                  item.disabled &&
                                    "cursor-not-allowed opacity-80 hover:bg-transparent hover:text-muted-foreground",
                                )}
                              >
                                <Icon className="size-5" />
                                {translateSidebarItemTitle(item.href, item.title, t)}
                                {item.badge && (
                                  <Badge className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full">
                                    {item.badge}
                                  </Badge>
                                )}
                              </Link>
                            ) : (
                              <Tooltip key={`tooltip-${item.title}`}>
                                <TooltipTrigger asChild>
                                  <Link
                                    key={`link-tooltip-${item.title}`}
                                    href={item.disabled ? "#" : item.href}
                                    className={cn(
                                      "flex items-center gap-3 rounded-md py-2 text-sm font-medium hover:bg-muted",
                                      isActive(item.href)
                                        ? "bg-muted"
                                        : "text-muted-foreground hover:text-accent-foreground",
                                      item.disabled &&
                                        "cursor-not-allowed opacity-80 hover:bg-transparent hover:text-muted-foreground",
                                    )}
                                  >
                                    <span className="flex size-full items-center justify-center">
                                      <Icon className="size-5" />
                                    </span>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  {translateSidebarItemTitle(item.href, item.title, t)}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </Fragment>
                        )
                      );
                    })}
                  </section>
                  )
                })}
              </nav>

              <div className="mt-auto xl:p-4 space-y-2">
                {isSidebarExpanded ? (
                  <Link
                    href="/"
                    className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                  >
                    <Icons.home className="size-3.5" />
                    <span>Înapoi la site</span>
                  </Link>
                ) : null}
                {isSidebarExpanded ? <UpgradeCard /> : null}
              </div>
            </div>
          </aside>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}

export function MobileSheetSidebar({ links }: DashboardSidebarProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const { isSm, isMobile } = useMediaQuery();
  const isActive = useIsActive();

  if (isSm || isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-9 shrink-0 md:hidden"
          >
            <Menu className="size-5" />
            <span className="sr-only">{t("common.toggle_navigation_menu")}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <ScrollArea className="h-full overflow-y-auto">
            <div className="flex h-screen flex-col">
              <nav className="flex flex-1 flex-col gap-y-8 p-6 text-lg font-medium">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <img src="/nex-nex-logo.svg" alt="Nex-Nex logo" className="size-8 flex-shrink-0" />
                  <img src="/nex-nex-sign.svg" alt="Nex-Nex" className="h-5 w-auto" />
                </Link>

                {links.map((section) => (
                  <section
                    key={section.title}
                    className="flex flex-col gap-0.5"
                  >
                    <p className="text-xs text-muted-foreground">
                      {translateSidebarSectionTitle(section.title, t)}
                    </p>

                    {section.items.map((item) => {
                      const Icon = Icons[item.icon || "arrowRight"];
                      return (
                        item.href && (
                          <Fragment key={`link-fragment-${item.title}`}>
                            <Link
                              key={`link-${item.title}`}
                              onClick={() => {
                                if (!item.disabled) setOpen(false);
                              }}
                              href={item.disabled ? "#" : item.href}
                              className={cn(
                                "flex items-center gap-3 rounded-md p-2 text-sm font-medium hover:bg-muted",
                                isActive(item.href)
                                  ? "bg-muted"
                                  : "text-muted-foreground hover:text-accent-foreground",
                                item.disabled &&
                                  "cursor-not-allowed opacity-80 hover:bg-transparent hover:text-muted-foreground",
                              )}
                            >
                              <Icon className="size-5" />
                              {translateSidebarItemTitle(item.href, item.title, t)}
                              {item.badge && (
                                <Badge className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full">
                                  {item.badge}
                                </Badge>
                              )}
                            </Link>
                          </Fragment>
                        )
                      );
                    })}
                  </section>
                ))}

                <div className="mt-auto">
                  <UpgradeCard />
                </div>
              </nav>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="flex size-9 animate-pulse rounded-lg bg-muted md:hidden" />
  );
}
