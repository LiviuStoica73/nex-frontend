import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

const cards = [
  {
    icon: "🧠",
    title: "Brand Intelligence",
    description:
      "Încarci documentele brandului o singură dată. AI-ul memorează tonul, produsele și valorile tale — și scrie ca tine de fiecare dată.",
    highlight: true,
  },
  {
    icon: "⚡",
    title: "De la idee la publicat în 3 minute",
    description:
      "Idee → text → imagine → publicare pe 6 platforme. Tot fluxul într-o singură aplicație, fără copy-paste între tool-uri.",
    highlight: false,
  },
  {
    icon: "🌍",
    title: "50+ limbi",
    description:
      "Generează și publică în orice limbă. AI-ul adaptează cultural mesajul — nu doar traduce cuvânt cu cuvânt.",
    highlight: false,
  },
  {
    icon: "📅",
    title: "Moment optim automat",
    description:
      "Algoritmul calculează orele de reach maxim per platformă și programează automat. Tu nu mai stai să verifici statistici.",
    highlight: false,
  },
];

export default function BentoGrid() {
  return (
    <section className="py-16 md:py-20">
      <MaxWidthWrapper>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold md:text-4xl">
            Tot ce ai nevoie, într-un singur loc
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            Nex-Nex înlocuiește 4 instrumente separate cu o singură aplicație, într-o experiență fluidă.
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
