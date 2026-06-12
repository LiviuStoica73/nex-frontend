"use client";

import { useTranslations } from "next-intl";

export function WorkflowSection() {
  const t = useTranslations("workflow_section");
  const steps = [
    {
      number: "01",
      title: t("steps.01.title"),
      description: t("steps.01.description"),
      image: "/_static/workflow/1-rag.webp",
    },
    {
      number: "02",
      title: t("steps.02.title"),
      description: t("steps.02.description"),
      image: "/_static/workflow/2-idei.webp",
    },
    {
      number: "03",
      title: t("steps.03.title"),
      description: t("steps.03.description"),
      image: "/_static/workflow/3-alegere.webp",
    },
    {
      number: "04",
      title: t("steps.04.title"),
      description: t("steps.04.description"),
      image: "/_static/workflow/4-text.webp",
    },
    {
      number: "05",
      title: t("steps.05.title"),
      description: t("steps.05.description"),
      image: "/_static/workflow/5-poza.webp",
    },
    {
      number: "06",
      title: t("steps.06.title"),
      description: t("steps.06.description"),
      image: "/_static/workflow/6-generare.webp",
    },
    {
      number: "07",
      title: t("steps.07.title"),
      description: t("steps.07.description"),
      image: "/_static/workflow/7-programare.webp",
    },
    {
      number: "08",
      title: t("steps.08.title"),
      description: t("steps.08.description"),
      image: "/_static/workflow/8-timing.webp",
    },
    {
      number: "09",
      title: t("steps.09.title"),
      description: t("steps.09.description"),
      image: "/_static/workflow/9-publicare.webp",
    },
    {
      number: "10",
      title: t("steps.10.title"),
      description: t("steps.10.description"),
      image: "/_static/workflow/10-limbi.webp",
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-heading font-bold md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="space-y-24">
          {steps.map((step, index) => {
            const isEven = index % 2 === 1;
            return (
              <div
                key={step.number}
                className={`flex flex-col gap-8 md:gap-16 items-center ${
                  isEven ? "md:flex-row-reverse" : "md:flex-row"
                }`}
              >
                {/* Imagine */}
                <div className="w-full md:w-1/2 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-56 md:w-72 drop-shadow-xl"
                  />
                </div>

                {/* Text */}
                <div className="w-full md:w-1/2 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-5xl font-heading font-bold text-[#A38C43] opacity-40 leading-none">
                      {step.number}
                    </span>
                    <div className="h-px flex-1 bg-[#A38C43] opacity-20" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-[#334C29]">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
