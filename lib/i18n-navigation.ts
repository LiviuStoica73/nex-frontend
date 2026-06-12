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
    "/dashboard/settings/brand-kit": "brand_kit",
    "/dashboard/billing": "billing",
    "/dashboard/settings": "settings",
    "/admin": "admin_panel",
  };

  const key = href ? keyByHref[href] : undefined;
  return key ? t(`dashboard_sidebar.items.${key}`) : fallback;
}
