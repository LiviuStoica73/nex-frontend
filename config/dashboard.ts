import { SidebarNavItem } from "types";

export const sidebarLinks: SidebarNavItem[] = [
  {
    title: "PUBLICARE",
    items: [
      { href: "/dashboard/calendar",                              icon: "lineChart", title: "Calendar" },
      { href: "/dashboard/campaigns",                             icon: "post",      title: "Campanii" },
      { href: "/dashboard/intelligence?tab=opportunities",        icon: "billing",   title: "Oportunități" },
      { href: "/dashboard/intelligence?tab=vizualizare",          icon: "dashboard", title: "Vizualizare" },
    ],
  },
  {
    title: "AI MARKETING",
    items: [
      { href: "/dashboard/settings/brand-kit?tab=documente",  icon: "page",      title: "Documente AI" },
      { href: "/dashboard/intelligence?tab=brain",          icon: "brain",     title: "Business Brain" },
      { href: "/dashboard/intelligence?tab=strategy",       icon: "lineChart", title: "Strategie" },
    ],
  },
  {
    title: "CONFIGURARE",
    items: [
      { href: "/dashboard/settings/brand-kit",       icon: "page",      title: "Brand Kit" },
      { href: "/dashboard/settings/social-accounts", icon: "twitter",   title: "Conturi Sociale" },
      { href: "/dashboard/settings/best-times",      icon: "lineChart", title: "Best Times" },
    ],
  },
  {
    title: "AGENȚIE",
    items: [
      { href: "/dashboard/clients",     icon: "users",     title: "Clienți",         agencyOnly: true },
      { href: "/dashboard/allocations", icon: "billing",   title: "Alocare credite", agencyOnly: true },
      { href: "/dashboard/reports",     icon: "lineChart", title: "Rapoarte",        agencyOnly: true },
    ],
  },
  {
    title: "CONT",
    items: [
      { href: "/dashboard",             icon: "dashboard", title: "Dashboard" },
      { href: "/dashboard/billing",     icon: "billing",   title: "Abonament" },
      { href: "/dashboard/billing/topup", icon: "billing", title: "Cumpără credite" },
      { href: "/dashboard/settings",    icon: "settings",  title: "Setări" },
      { href: "/dashboard/admin",       icon: "laptop",    title: "Super Admin", superadminOnly: true },
    ],
  },
];
