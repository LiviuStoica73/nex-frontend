"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useOrg } from "@/contexts/org-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const API = process.env.NEXT_PUBLIC_API_URL || ""

const PLATFORMS = ["instagram", "linkedin", "facebook", "x", "bluesky", "discord"] as const
type Platform = typeof PLATFORMS[number]

type TimeSlot = [number, number]
type BestTimes = Record<Platform, TimeSlot[]>

const DEFAULT_BEST_TIMES: BestTimes = {
  instagram: [[9, 0], [18, 0]],
  linkedin:  [[8, 0], [12, 0]],
  facebook:  [[13, 0], [20, 0]],
  x:         [[9, 0], [17, 0]],
  bluesky:   [[9, 0], [18, 0]],
  discord:   [[18, 0], [21, 0]],
}

function fmtTime([h, m]: TimeSlot) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function parseTime(str: string): TimeSlot | null {
  const [h, m] = str.split(":").map(Number)
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null
  return [h, m]
}

export default function BestTimesPage() {
  const { data: session } = useSession()
  const token = (session?.user as { accessToken?: string })?.accessToken ?? ""
  const { activeOrg, activeOrgId: orgId } = useOrg()

  const [times, setTimes] = useState<BestTimes>(DEFAULT_BEST_TIMES)
  const [draft, setDraft] = useState<Record<Platform, string[]>>({} as Record<Platform, string[]>)
  const [busy, setBusy] = useState(false)

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!orgId || !token) return
    fetch(`${API}/api/v1/orgs/${orgId}/best-times`, { headers })
      .then((r) => r.json())
      .then((data) => {
        setTimes(data)
        const d: Record<string, string[]> = {}
        for (const p of PLATFORMS) d[p] = (data[p] || DEFAULT_BEST_TIMES[p]).map(fmtTime)
        setDraft(d as Record<Platform, string[]>)
      })
  }, [orgId, token])

  const save = async () => {
    const payload: Record<string, TimeSlot[]> = {}
    for (const p of PLATFORMS) {
      const parsed = draft[p].map(parseTime).filter(Boolean) as TimeSlot[]
      if (parsed.length === 0) { toast.error(`${p}: cel puțin un slot obligatoriu`); return }
      payload[p] = parsed
    }
    setBusy(true)
    const res = await fetch(`${API}/api/v1/orgs/${orgId}/best-times`, {
      method: "PUT", headers, body: JSON.stringify(payload),
    })
    setBusy(false)
    if (res.ok) toast.success("Best times salvate!")
    else toast.error("Eroare la salvare")
  }

  const updateSlot = (platform: Platform, idx: number, value: string) => {
    setDraft((d) => ({ ...d, [platform]: d[platform].map((v, i) => i === idx ? value : v) }))
  }

  const addSlot = (platform: Platform) => {
    setDraft((d) => ({ ...d, [platform]: [...d[platform], "09:00"] }))
  }

  const removeSlot = (platform: Platform, idx: number) => {
    setDraft((d) => ({ ...d, [platform]: d[platform].filter((_, i) => i !== idx) }))
  }

  const reset = () => {
    const d: Record<string, string[]> = {}
    for (const p of PLATFORMS) d[p] = DEFAULT_BEST_TIMES[p].map(fmtTime)
    setDraft(d as Record<Platform, string[]>)
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Best time to post</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset}>Reset la default</Button>
          <Button size="sm" disabled={busy} onClick={save}>{busy ? "Salvare..." : "Salvează"}</Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Orele sunt UTC. Sistemul va programa postările în primul slot liber disponibil.
      </p>

      {PLATFORMS.map((platform) => (
        <Card key={platform}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base capitalize">{platform}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 items-center">
              {(draft[platform] || []).map((slot, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <Input
                    type="time"
                    value={slot}
                    onChange={(e) => updateSlot(platform, idx, e.target.value)}
                    className="h-8 w-28 text-sm"
                  />
                  <button
                    onClick={() => removeSlot(platform, idx)}
                    className="text-muted-foreground hover:text-destructive text-lg leading-none"
                    disabled={(draft[platform] || []).length <= 1}
                  >×</button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="h-8" onClick={() => addSlot(platform)}>
                + Adaugă slot
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
