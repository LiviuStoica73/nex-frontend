"use client"

import { useEffect } from "react"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("App error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-6">
      <h1 className="text-6xl font-bold text-muted-foreground">500</h1>
      <h2 className="mt-4 text-2xl font-semibold">Ceva a mers greșit</h2>
      <p className="mt-2 text-muted-foreground max-w-md">
        A apărut o eroare neașteptată. Echipa noastră a fost notificată automat.
      </p>
      <button onClick={reset}
        className="mt-6 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        Încearcă din nou
      </button>
    </div>
  )
}
