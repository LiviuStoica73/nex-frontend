"use client";

const steps = [
  {
    number: "01",
    title: "AI învață business-ul tău",
    description:
      "Încarci documentele brandului — ghid de stil, produse, ton de comunicare. AI-ul tău personal învață totul și devine expertul brandului tău.",
    image: "/_static/workflow/1-ai-invata-business-ul-tau-(rag).png",
  },
  {
    number: "02",
    title: "Ceri idei de postare",
    description:
      "Îi spui lui Nex-Nex despre ce vrei să postezi. Primești instant 5 idei creative, adaptate brandului și audienței tale.",
    image: "/_static/workflow/2-ceri-idei-de-postare.png",
  },
  {
    number: "03",
    title: "Alegi ideea",
    description:
      "Selectezi ideea care ți se potrivește cel mai bine. Nex-Nex o dezvoltă în direcția pe care o alegi tu.",
    image: "/_static/workflow/3-alegi-ideea.png",
  },
  {
    number: "04",
    title: "AI scrie textul, SEO și hashtag-urile",
    description:
      "Primești textul complet, optimizat SEO, cu hashtag-urile potrivite pentru fiecare platformă. Editezi dacă vrei, sau publici direct.",
    image: "/_static/workflow/4-ai-dezvolta-textul-seo-hashtag-uri.png",
  },
  {
    number: "05",
    title: "Urci poza sau ceri una AI",
    description:
      "Ai o poză? O încarci. Nu ai? Descrii ce vrei și AI-ul generează un prompt profesional pentru imaginea perfectă.",
    image: "/_static/workflow/5-urci-poza-sau-ai-propune-prompt.png",
  },
  {
    number: "06",
    title: "AI generează imaginea",
    description:
      "Din promptul tău, AI-ul creează imagini profesionale. Alegi varianta preferată direct din aplicație.",
    image: "/_static/workflow/6-ai-creeaza-poza.png",
  },
  {
    number: "07",
    title: "Postezi acum sau programezi",
    description:
      "Publici imediat sau alegi momentul optim. Nex-Nex îți arată când audiența ta e cel mai activă.",
    image: "/_static/workflow/7-postezi-acum-sau-programezi.png",
  },
  {
    number: "08",
    title: "Moment optim per rețea",
    description:
      "Fiecare platformă are orele ei de aur. Nex-Nex calculează automat când să postezi pe Instagram, LinkedIn, TikTok și altele pentru reach maxim.",
    image: "/_static/workflow/8-randament-maxim-per-retea.png",
  },
  {
    number: "09",
    title: "Publici pe toate rețelele",
    description:
      "Un singur click — postarea ajunge simultan pe toate platformele tale: Instagram, LinkedIn, Facebook, X, TikTok, Discord.",
    image: "/_static/workflow/9-publica-pe-multiple-retele.png",
  },
  {
    number: "10",
    title: "În orice limbă",
    description:
      "Audiența ta e globală? Nex-Nex traduce și adaptează cultural postarea în peste 50 de limbi, menținând vocea brandului tău.",
    image: "/_static/workflow/10-postari-in-orice-limba.png",
  },
];

export function WorkflowSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-heading font-bold md:text-4xl">
            Cum funcționează
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            De la idee la publicare pe toate rețelele — în câteva minute.
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
