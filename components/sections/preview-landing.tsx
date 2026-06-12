import { getTranslations } from "next-intl/server";

import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

export default async function PreviewLanding() {
  const t = await getTranslations("preview_landing");

  return (
    <div className="pb-6 sm:pb-16">
      <MaxWidthWrapper>
        <div className="rounded-xl md:bg-muted/30 md:p-3.5 md:ring-1 md:ring-inset md:ring-border">
          <div className="relative overflow-hidden rounded-xl border md:rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/_static/hero.webp"
              alt={t("image_alt")}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </MaxWidthWrapper>
    </div>
  );
}
