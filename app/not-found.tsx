import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-6">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">Pagina nu a fost găsită</h2>
      <p className="mt-2 text-muted-foreground">
        Pagina pe care o cauți nu există sau a fost mutată.
      </p>
      <Link href="/dashboard"
        className="mt-6 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        Mergi la Dashboard
      </Link>
    </div>
  )
}
