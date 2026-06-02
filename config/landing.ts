import { FeatureLdg, InfoLdg, TestimonialType } from "types";

export const infos: InfoLdg[] = [
  {
    title: "AI care știe brandul tău",
    description:
      "Uploadează documente despre produsele tale, prețuri și ton de comunicare. AI-ul generează conținut 100% factual — zero hallucinations, zero texte generice.",
    image: "/_static/illustrations/work-from-home.jpg",
    list: [
      {
        title: "Brand Voice",
        description: "Definești tonul, valorile și publicul țintă o singură dată.",
        icon: "laptop",
      },
      {
        title: "RAG per brand",
        description: "AI-ul citește documentele tale și scrie despre ce știe.",
        icon: "settings",
      },
      {
        title: "Multi-limbă",
        description: "Generează nativ în română, engleză, germană și alte 6 limbi.",
        icon: "search",
      },
    ],
  },
  {
    title: "Publică pe toate platformele",
    description:
      "Conectezi conturile o singură dată și publici simultan pe Facebook, Instagram, LinkedIn, X, Discord și blog WordPress. Direct API, fără intermediari scumpi.",
    image: "/_static/illustrations/work-from-home.jpg",
    list: [
      {
        title: "Direct API",
        description: "Fără Zapier, fără Zernio. Costuri minime la volum mare.",
        icon: "laptop",
      },
      {
        title: "Calendar editorial",
        description: "Drag & drop, ore optime automate, bulk scheduling.",
        icon: "search",
      },
      {
        title: "Retry automat",
        description: "Dacă publicarea eșuează, sistemul încearcă de 3 ori automat.",
        icon: "settings",
      },
    ],
  },
];

export const features: FeatureLdg[] = [
  {
    title: "Telegram Bot",
    description:
      "Trimite o idee din telefon. AI-ul generează postarea, tu o aprobi cu un tap. Publicare imediată sau programată.",
    link: "/pricing",
    icon: "laptop",
  },
  {
    title: "Brand Intelligence (RAG)",
    description:
      "Upload PDF, DOCX sau URL cu descrierea brandului. AI-ul scrie ca și cum ar cunoaște compania ta de ani de zile.",
    link: "/pricing",
    icon: "settings",
  },
  {
    title: "Calendar Editorial",
    description:
      "Vizualizare lunară și săptămânală. Drag & drop pentru reprogramare. Culori per platformă și status.",
    link: "/pricing",
    icon: "laptop",
  },
  {
    title: "Generator de Idei",
    description:
      "100 de idei de postări generate din contextul brandului tău. Educational, promotional, storytelling — distribuite pe categorii.",
    link: "/pricing",
    icon: "copy",
  },
  {
    title: "Agency Mode",
    description:
      "Gestionează toți clienții dintr-un singur cont. Switch rapid între workspace-uri, billing unificat.",
    link: "/pricing",
    icon: "user",
  },
  {
    title: "Analytics",
    description:
      "Reach, impressions, likes și shares sincronizate automat de pe toate platformele. Top 5 posturi per perioadă.",
    link: "/pricing",
    icon: "search",
  },
];

export const testimonials: TestimonialType[] = [
  {
    name: "Andrei Popescu",
    job: "Fondator startup SaaS",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    review:
      "Am trecut de la 3 ore/săptămână pe social media la 15 minute. Nex-Nex generează exact tonul brandului nostru — nu mai corectez textele AI.",
  },
  {
    name: "Maria Ionescu",
    job: "Social Media Manager",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    review:
      "Gestionez 8 clienți cu Nex-Nex Agency. Calendar vizual, aprobare rapidă, publicare automată. A eliminat jumătate din munca mea manuală.",
  },
  {
    name: "Radu Constantin",
    job: "Antreprenor e-commerce",
    image: "https://randomuser.me/api/portraits/men/67.jpg",
    review:
      "Botul de Telegram e genial. Fac o poză la un produs nou, AI-ul scrie captionul, eu aprob, gata. Tot procesul durează 2 minute.",
  },
  {
    name: "Elena Dumitrescu",
    job: "Creator de conținut",
    image: "https://randomuser.me/api/portraits/women/23.jpg",
    review:
      "RAG-ul face diferența față de orice alt tool. AI-ul știe exact prețurile, features și valorile brandului meu. Zero post-uri cu informații greșite.",
  },
  {
    name: "Mihai Stanescu",
    job: "Director Marketing",
    image: "https://randomuser.me/api/portraits/men/55.jpg",
    review:
      "Echipa noastră de 5 persoane publică acum de 3x mai mult conținut. Workflow-ul de aprobare cu Nex-Nex e mult mai rapid decât orice tool am testat.",
  },
  {
    name: "Ana Popa",
    job: "Freelancer Content",
    image: "https://randomuser.me/api/portraits/women/12.jpg",
    review:
      "Ca freelancer cu 12 clienți, Nex-Nex Agency mi-a salvat business-ul. Un singur abonament, toți clienții sub control, facturare simplă.",
  },
  {
    name: "Bogdan Muresan",
    job: "Co-fondator agenție digitală",
    image: "https://randomuser.me/api/portraits/men/78.jpg",
    review:
      "Am încercat Buffer, Hootsuite, SocialBee. Nex-Nex e singurul cu bot Telegram + RAG per client. Pentru agenții, e game changer.",
  },
  {
    name: "Ioana Constantin",
    job: "Antreprenor local — Salon frumusețe",
    image: "https://randomuser.me/api/portraits/women/65.jpg",
    review:
      "Nu știam nimic despre social media. Acum postez zilnic pe Instagram și Facebook fără să pierd timp. Nex-Nex face totul — eu doar aprob.",
  },
];
