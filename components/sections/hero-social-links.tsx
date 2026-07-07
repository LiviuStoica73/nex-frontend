"use client";

import { useLocale } from "next-intl";
import {
  Facebook,
  Instagram,
  Linkedin,
  X as XIcon,
  AtSign,
  Rss,
  MessageSquare,
} from "lucide-react";

const ACTIVE_NETWORKS = [
  {
    key: "facebook",
    label: "Facebook",
    icon: Facebook,
    href: "https://www.facebook.com/profile.php?id=61591553660673",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: Instagram,
    href: "https://www.instagram.com/nex_nex_ai/",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    href: "https://www.linkedin.com/in/liviu-stoica/",
  },
  {
    key: "x",
    label: "X",
    icon: XIcon,
    href: "https://x.com/nexnexcom",
  },
  {
    key: "bluesky",
    label: "Bluesky",
    icon: AtSign,
    href: "https://bsky.app/profile/nex-nex.bsky.social",
  },
  {
    key: "blog",
    label: "WordPress Blog",
    icon: Rss,
    href: "https://blog.nex-nex.com",
  },
] as const;

const DISCORD_HREF_BY_LOCALE: Record<string, string> = {
  ro: "https://discord.com/channels/1521138949643571260/1521140695656566844",
};
const DISCORD_HREF_DEFAULT =
  "https://discord.com/channels/1521138949643571260/1521140655877914844";

export default function HeroSocialLinks() {
  const locale = useLocale();
  const discordHref = DISCORD_HREF_BY_LOCALE[locale] ?? DISCORD_HREF_DEFAULT;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-muted-foreground">
      {ACTIVE_NETWORKS.map(({ key, label, icon: Icon, href }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={label}
          aria-label={label}
          className="transition-colors hover:text-foreground"
        >
          <Icon className="h-5 w-5" />
        </a>
      ))}
      <a
        href={discordHref}
        target="_blank"
        rel="noopener noreferrer"
        title="Discord"
        aria-label="Discord"
        className="transition-colors hover:text-foreground"
      >
        <MessageSquare className="h-5 w-5" />
      </a>
    </div>
  );
}
