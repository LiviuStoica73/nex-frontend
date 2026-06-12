"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SidebarNavItem } from "@/types";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Icons } from "@/components/shared/icons";
import {
  translateSidebarItemTitle,
  translateSidebarSectionTitle,
} from "@/lib/i18n-navigation";

export function SearchCommand({ links }: { links: SidebarNavItem[] }) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start rounded-md bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-72",
        )}
        onClick={() => setOpen(true)}
      >
        <span className="inline-flex">
          {t("search.button")}
          <span className="hidden sm:inline-flex">&nbsp;{t("search.docs_suffix")}</span>...
        </span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.45rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t("search.placeholder")} />
        <CommandList>
          <CommandEmpty>{t("search.no_results")}</CommandEmpty>
          {links.map((section) => (
            <CommandGroup
              key={section.title}
              heading={translateSidebarSectionTitle(section.title, t)}
            >
              {section.items.map((item) => {
                const Icon = Icons[item.icon || "arrowRight"];
                return (
                  <CommandItem
                    key={item.title}
                    onSelect={() => {
                      runCommand(() => router.push(item.href as string));
                    }}
                  >
                    <Icon className="mr-2 size-5" />
                    {translateSidebarItemTitle(item.href, item.title, t)}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
