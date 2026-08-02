"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Facebook,
  Instagram,
  Linkedin,
  X as XIcon,
  Rss,
  Youtube,
  Clapperboard,
} from "lucide-react";

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M15 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M8.5 17c0 1 -1.356 3 -1.832 3c-1.429 0 -2.698 -1.667 -3.333 -3c-.635 -2 -.476 -7.5 2 -9.5c1.182 -.911 3 -1.5 4 -1.5l.5 1c1 0 2 .5 2.5 1" />
      <path d="M15.5 17c0 1 1.356 3 1.832 3c1.429 0 2.698 -1.667 3.333 -3c.635 -2 .476 -7.5 -2 -9.5c-1.182 -.911 -3 -1.5 -4 -1.5l-.5 1c-1 0 -2 .5 -2.5 1" />
    </svg>
  );
}

function BlueSkyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.335 5.144c-1.654 -1.199 -4.335 -2.127 -4.335 .826c0 .59 .35 4.953 .556 5.661c.713 2.463 3.13 2.75 5.444 2.369c-4.045 .665 -4.889 3.208 -2.667 5.41c1.03 1.018 1.913 1.59 2.667 1.59c2 0 3.134 -2.769 3.5 -3.5c.333 -.667 .5 -1.167 .5 -1.5c0 .333 .167 .833 .5 1.5c.366 .731 1.5 3.5 3.5 3.5c.754 0 1.637 -.572 2.667 -1.59c2.222 -2.202 1.378 -4.745 -2.667 -5.41c2.314 .38 4.73 .094 5.444 -2.369c.206 -.708 .556 -5.072 .556 -5.661c0 -2.953 -2.68 -2.025 -4.335 -.826c-1.652 1.198 -3.326 4.377 -3.665 5.144c-.34 -.767 -2.013 -3.946 -3.665 -5.144z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 7.917v4.034a9.948 9.948 0 0 1 -5 -1.951v4.5a6.5 6.5 0 1 1 -8 -6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917z" />
    </svg>
  );
}

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
    icon: BlueSkyIcon,
    href: "https://bsky.app/profile/nex-nex.bsky.social",
  },
  {
    key: "blog",
    label: "WordPress Blog",
    icon: Rss,
    href: "https://blog.nex-nex.com",
  },
] as const;

const COMING_SOON_NETWORKS = [
  { key: "tiktok", label: "TikTok", icon: TikTokIcon },
  { key: "youtube", label: "YouTube", icon: Youtube },
  { key: "shorts", label: "Shorts", icon: Clapperboard },
] as const;

const DISCORD_INVITE = "https://discord.gg/HDsK86uCq";

export default function HeroSocialLinks() {
  const t = useTranslations("hero_landing");

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
        href={DISCORD_INVITE}
        target="_blank"
        rel="noopener noreferrer"
        title="Discord"
        aria-label="Discord"
        className="transition-colors hover:text-foreground"
      >
        <DiscordIcon className="h-5 w-5" />
      </a>
      {COMING_SOON_NETWORKS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => toast(t("coming_soon_toast", { network: label }))}
          title={label}
          aria-label={label}
          className="transition-colors hover:text-foreground"
        >
          <Icon className="h-5 w-5" />
        </button>
      ))}
    </div>
  );
}
