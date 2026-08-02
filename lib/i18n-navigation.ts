export function translateMarketingNavTitle(
  href: string,
  fallback: string,
  t: (key: string) => string,
): string {
  const keyByHref: Record<string, string> = {
    "/pricing": "pricing",
    "/#features": "features",
    "/blog": "blog",
  };

  const key = keyByHref[href];
  return key ? t(`marketing_nav.${key}`) : fallback;
}

export function translateDocsNavTitle(
  href: string,
  fallback: string,
  t: (key: string) => string,
): string {
  const keyByHref: Record<string, string> = {
    "/docs": "documentation",
    "/guides": "guides",
  };

  const key = keyByHref[href];
  return key ? t(`docs_nav.${key}`) : fallback;
}

export function translateSidebarSectionTitle(
  fallback: string,
  t: (key: string) => string,
): string {
  const keyByTitle: Record<string, string> = {
    "PUBLICARE": "publishing",
    "AI MARKETING": "ai_marketing",
    "CONFIGURARE": "configuration",
    "AGENȚIE": "agency",
    "CONȚINUT": "content",
    BRAND: "brand",
    CONT: "account",
  };

  const key = keyByTitle[fallback];
  return key ? t(`dashboard_sidebar.sections.${key}`) : fallback;
}

export function translateSidebarItemTitle(
  href: string | undefined,
  fallback: string,
  t: (key: string) => string,
): string {
  const keyByHref: Record<string, string> = {
    "/dashboard": "dashboard",
    "/dashboard/campaigns": "campaigns",
    "/dashboard/calendar": "calendar",
    "/dashboard/intelligence?tab=opportunities": "opportunities",
    "/dashboard/intelligence?tab=vizualizare": "visualization",
    "/dashboard/settings/brand-kit?tab=documente": "ai_documents",
    "/dashboard/intelligence?tab=brain": "business_brain",
    "/dashboard/intelligence?tab=strategy": "strategy",
    "/dashboard/settings/brand-kit": "brand_kit",
    "/dashboard/settings/social-accounts": "social_accounts",
    "/dashboard/settings/best-times": "best_times",
    "/dashboard/clients": "clients",
    "/dashboard/allocations": "allocations",
    "/dashboard/reports": "reports",
    "/dashboard/billing": "billing",
    "/dashboard/billing/topup": "buy_credits",
    "/dashboard/settings": "settings",
    "/dashboard/admin": "super_admin",
    "/admin": "admin_panel",
  };

  const key = href ? keyByHref[href] : undefined;
  return key ? t(`dashboard_sidebar.items.${key}`) : fallback;
}
