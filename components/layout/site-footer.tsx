import * as React from "react";
import Link from "next/link";

import { footerLinks, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/layout/mode-toggle";

export function SiteFooter({ className }: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer className={cn("border-t", className)}>
      <div className="container grid max-w-6xl grid-cols-2 gap-6 py-14 md:grid-cols-4">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/_static/logo-icon.png"
            alt="Nex-Nex"
            className="h-10 w-auto mb-4"
          />
          <p className="text-sm text-muted-foreground max-w-xs">
            AI învață brandul tău, creează conținut profesionist și-l publică
            automat pe rețele sociale.
          </p>
        </div>

        {/* Links */}
        {footerLinks.map((section) => (
          <div key={section.title}>
            <span className="text-sm font-medium text-foreground">
              {section.title}
            </span>
            <ul className="mt-4 list-inside space-y-3">
              {section.items?.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t py-4">
        <div className="container flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            © 2026{" "}
            <Link
              href="https://nex-nex.com"
              className="font-medium hover:underline"
            >
              Nex-Nex.com
            </Link>{" "}
            · All rights reserved ·{" "}
            <Link
              href="mailto:contact@nex-nex.com"
              className="hover:underline"
            >
              contact@nex-nex.com
            </Link>
          </p>

          <div className="flex items-center gap-4">
            {/* ANPC badges */}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noreferrer"
              aria-label="Soluționarea Online a Litigiilor"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/_static/anpc-sol.webp"
                alt="Soluționarea Online a Litigiilor"
                className="h-10 w-auto"
              />
            </a>
            <a
              href="https://anpc.ro/ce-este-sal/"
              target="_blank"
              rel="noreferrer"
              aria-label="Soluționarea Alternativă a Litigiilor"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/_static/anpc-sal.webp"
                alt="Soluționarea Alternativă a Litigiilor"
                className="h-10 w-auto"
              />
            </a>
            <ModeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
