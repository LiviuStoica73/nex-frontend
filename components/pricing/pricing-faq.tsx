"use client";

import { useTranslations } from "next-intl";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HeaderSection } from "../shared/header-section";

const FAQ_KEYS = ["item_1", "item_2", "item_3", "item_4", "item_5", "item_6", "item_7"];

export function PricingFaq() {
  const t = useTranslations("pricing_faq");

  return (
    <section className="container max-w-4xl py-2">
      <HeaderSection
        label={t("label")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <Accordion type="single" collapsible className="my-12 w-full">
        {FAQ_KEYS.map((key) => (
          <AccordionItem key={key} value={key}>
            <AccordionTrigger>{t(`items.${key}.question`)}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground sm:text-[15px]">
              {t(`items.${key}.answer`)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
