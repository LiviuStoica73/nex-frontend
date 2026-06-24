import { UserRole } from "@prisma/client";
import { SidebarNavItem } from "types";

export const sidebarLinks: SidebarNavItem[] = [
  {
    title: "CONȚINUT",
    items: [
      { href: "/dashboard",            icon: "dashboard",  title: "Dashboard" },
      { href: "/dashboard/campaigns",  icon: "post",       title: "Postări" },
      { href: "/dashboard/calendar",   icon: "lineChart",  title: "Calendar" },
    ],
  },
  {
    title: "BRAND",
    items: [
      { href: "/dashboard/settings/brand-kit",       icon: "page",    title: "Brand Kit" },
      { href: "/dashboard/settings/social-accounts", icon: "twitter", title: "Conturi Sociale" },
    ],
  },
  {
    title: "AGENȚIE",
    items: [
      { href: "/dashboard/clients",     icon: "users",   title: "Clienți",         agencyOnly: true },
      { href: "/dashboard/allocations", icon: "billing", title: "Alocare credite", agencyOnly: true },
      { href: "/dashboard/reports",     icon: "lineChart", title: "Rapoarte",      agencyOnly: true },
    ],
  },
  {
    title: "CONT",
    items: [
      { href: "/dashboard/billing",  icon: "billing",  title: "Abonament",   authorizeOnly: UserRole.USER },
      { href: "/dashboard/settings", icon: "settings", title: "Setări" },
      { href: "/admin",              icon: "laptop",   title: "Admin Panel",  authorizeOnly: UserRole.ADMIN },
    ],
  },
];
