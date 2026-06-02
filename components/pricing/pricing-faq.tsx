import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { HeaderSection } from "../shared/header-section"

const pricingFaqData = [
  {
    id: "item-1",
    question: "Există un trial gratuit?",
    answer:
      "Da — 14 zile trial gratuit pe planul Pro, fără card de credit. Explorezi toate funcționalitățile înainte de orice angajament.",
  },
  {
    id: "item-2",
    question: "Pot anula oricând?",
    answer:
      "Da, anulezi oricând din dashboard, fără penalități. La anulare rămâi pe planul plătit până la sfârșitul perioadei facturate.",
  },
  {
    id: "item-3",
    question: "Ce înseamnă RAG per brand?",
    answer:
      "RAG (Retrieval-Augmented Generation) înseamnă că AI-ul citește documentele pe care le încarci tu — descrieri produse, prețuri, FAQ — și generează conținut bazat pe informații reale, nu inventate. Fiecare brand are propriul set de documente izolat.",
  },
  {
    id: "item-4",
    question: "Ce platforme sociale sunt suportate?",
    answer:
      "Facebook, Instagram, LinkedIn, X (Twitter), Discord și WordPress Blog — prin API direct. YouTube, Threads și Bluesky vin în Faza 2. TikTok și Pinterest sunt în backlog (necesită review extern de luni).",
  },
  {
    id: "item-5",
    question: "Cum funcționează Telegram Bot?",
    answer:
      "Conectezi contul Nex-Nex cu Telegram din Settings. Apoi scrii orice temă în chat — AI-ul generează postarea cu RAG-ul brandului tău, tu aprobi cu un buton, și e publicată sau programată automat. Funcționează de pe orice telefon.",
  },
  {
    id: "item-6",
    question: "Există discount pentru abonament anual?",
    answer:
      "Da — discount de ~17% (echivalent 2 luni gratuite) la abonamentul anual față de cel lunar.",
  },
  {
    id: "item-7",
    question: "Planul Agency acoperă toți clienții mei?",
    answer:
      "Da — un singur abonament Agency (€199/lună) acoperă până la 15 clienți. Agency XL (€349/lună) e nelimitat. Fiecare client are workspace izolat, login propriu și RAG propriu.",
  },
]

export function PricingFaq() {
  return (
    <section className="container max-w-4xl py-2">
      <HeaderSection
        label="FAQ"
        title="Întrebări frecvente"
        subtitle="Dacă nu găsești răspunsul, scrie-ne la support@nex-nex.com."
      />

      <Accordion type="single" collapsible className="my-12 w-full">
        {pricingFaqData.map((faqItem) => (
          <AccordionItem key={faqItem.id} value={faqItem.id}>
            <AccordionTrigger>{faqItem.question}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground sm:text-[15px]">
              {faqItem.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
