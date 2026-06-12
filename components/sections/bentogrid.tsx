import { useTranslations } from "next-intl";

import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

export default function BentoGrid() {
  const t = useTranslations("bentogrid_section");
  const cards = [
    {
      icon: "🧠",
      title: t("cards.brand_intelligence.title"),
      description: t("cards.brand_intelligence.description"),
      highlight: true,
    },
    {
      icon: "⚡",
      title: t("cards.from_idea_to_published.title"),
      description: t("cards.from_idea_to_published.description"),
      highlight: false,
    },
    {
      icon: "🌍",
      title: t("cards.languages.title"),
      description: t("cards.languages.description"),
      highlight: false,
    },
    {
      icon: "📅",
      title: t("cards.best_time.title"),
      description: t("cards.best_time.description"),
      highlight: false,
    },
  ];

  return (
    <section className="py-16 md:py-20">
      <MaxWidthWrapper>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, index) => {
            const isGreen = index === 0;
            return (
              <div
                key={card.title}
                className={`relative rounded-2xl border p-6 space-y-3 ${
                  isGreen
                    ? "bg-[#334C29] text-white border-[#334C29]"
                    : "bg-background"
                }`}
              >
                <div className="text-4xl">{card.icon}</div>
                <h3
                  className={`font-heading font-bold text-lg ${
                    isGreen ? "text-white" : "text-foreground"
                  }`}
                >
                  {card.title}
                </h3>
                <p
                  className={`text-sm leading-relaxed ${
                    isGreen ? "text-white/80" : "text-muted-foreground"
                  }`}
                >
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </MaxWidthWrapper>
    </section>
  );
}
