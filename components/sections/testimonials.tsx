import Image from "next/image";
import { useTranslations } from "next-intl";

export default function Testimonials() {
  const t = useTranslations("testimonials_section");
  const items = t.raw("items") as Array<{ name: string; job: string; review: string; image: string }>;

  return (
    <section>
      <div className="container flex max-w-6xl flex-col gap-10 py-32 sm:gap-y-16">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            {t("label")}
          </p>
          <h2 className="text-3xl font-heading font-bold md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-muted-foreground text-base italic max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="column-1 gap-5 space-y-5 md:columns-2 lg:columns-3">
          {items.map((item) => (
            <div className="break-inside-avoid" key={item.name}>
              <div className="relative rounded-xl border bg-muted/25">
                <div className="flex flex-col px-4 py-5 sm:p-6">
                  <div>
                    <div className="relative mb-4 flex items-center gap-3">
                      <span className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-full text-base">
                        <Image
                          width={100}
                          height={100}
                          className="size-full rounded-full border"
                          src={item.image}
                          alt={item.name}
                        />
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {item.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.job}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {t("badge_ai")}
                      </span>
                    </div>
                    <q className="text-muted-foreground">{item.review}</q>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
