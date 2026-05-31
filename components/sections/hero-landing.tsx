import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export default async function HeroLanding() {
  return (
    <section className="space-y-6 py-12 sm:py-20 lg:py-24">
      <div className="container flex max-w-5xl flex-col items-center gap-5 text-center">
        <Link
          href="/pricing"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm", rounded: "full" }),
            "px-4",
          )}
        >
          <span className="mr-2">🚀</span>
          14 zile trial gratuit · Fără card de credit
        </Link>

        <h1 className="text-balance font-urban text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-[66px]">
          De la idee la publicat{" "}
          <span className="text-gradient_indigo-purple font-extrabold">
            în câteva minute
          </span>
        </h1>

        <p
          className="max-w-2xl text-balance leading-normal text-muted-foreground sm:text-xl sm:leading-8"
          style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}
        >
          NexNex este copilotul tău AI pentru conținut social media. Generează,
          programează și publică pe toate rețelele — cu AI care știe brandul tău.
        </p>

        <div
          className="flex justify-center space-x-2 md:space-x-4"
          style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
        >
          <Link
            href="/register"
            prefetch={true}
            className={cn(
              buttonVariants({ size: "lg", rounded: "full" }),
              "gap-2",
            )}
          >
            <span>Încearcă gratuit</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
          <Link
            href="/pricing"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg", rounded: "full" }),
              "px-5",
            )}
          >
            Vezi planuri
          </Link>
        </div>

        <p className="text-sm text-muted-foreground">
          Facebook · Instagram · LinkedIn · X · Discord · Blog WordPress
        </p>
      </div>
    </section>
  )
}
