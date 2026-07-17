import { SidebarNavItem, SiteConfig } from "types";
import { env } from "@/env.mjs";

const site_url = env.NEXT_PUBLIC_APP_URL;

export const siteConfig: SiteConfig = {
  name: "Nex-Nex",
  description:
    "Your AI Marketing Manager — builds your content strategy, creates professional posts, and publishes automatically on all social networks.",
  url: site_url,
  ogImage: `${site_url}/_static/og.jpg`,
  links: {
    twitter: "https://twitter.com/nexnexai",
    github: "https://github.com/nexnex",
  },
  logo: "/_static/logo.png",
  icon: "/_static/icon.png",
  mailSupport: "support@nex-nex.com",
};

export const footerLinks: SidebarNavItem[] = [
  {
    title: "Produs",
    items: [
      { title: "Funcționalități", href: "/#features" },
      { title: "Cum funcționează", href: "/#workflow" },
      { title: "Intelligence AI", href: "/intelligence" },
      { title: "Prețuri", href: "/pricing" },
      { title: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Legal",
    items: [
      { title: "Termeni și Condiții", href: "/terms" },
      { title: "Politică de Confidențialitate", href: "/privacy" },
    ],
  },
  {
    title: "Suport",
    items: [
      { title: "Email", href: "mailto:contact@nex-nex.com" },
    ],
  },
];
