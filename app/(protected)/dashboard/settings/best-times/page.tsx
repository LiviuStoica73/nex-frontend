"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useOrg } from "@/contexts/org-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const API = process.env.NEXT_PUBLIC_API_URL || ""

// L M M J V S D — index 0 = Luni ... 6 = Duminică (aliniat cu datetime.weekday() din backend)
const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"]
const WEEKDAY_NAMES = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"]
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

type TimeSlot = [number, number]
type PlatformSchedule = { days: number[]; slots: TimeSlot[] }
type BestTimes = Record<string, PlatformSchedule>

const DEFAULT_SLOTS: Record<string, TimeSlot[]> = {
  instagram: [[9, 0], [18, 0]],
  linkedin:  [[8, 0], [12, 0]],
  facebook:  [[13, 0], [20, 0]],
  x:         [[9, 0], [17, 0]],
  bluesky:   [[9, 0], [18, 0]],
  discord:   [[18, 0], [21, 0]],
  threads:   [[9, 0], [18, 0]],
  tiktok:    [[18, 0], [21, 0]],
  youtube:   [[18, 0], [21, 0]],
  pinterest: [[9, 0], [18, 0]],
  blog:      [[9, 0], [18, 0]],
}

function defaultSlotsFor(platform: string): TimeSlot[] {
  return DEFAULT_SLOTS[platform] || [[9, 0], [18, 0]]
}

function fmtTime([h, m]: TimeSlot) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function parseTime(str: string): TimeSlot | null {
  const [h, m] = str.split(":").map(Number)
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null
  return [h, m]
}

// Normalizează orice formă venită din backend (nouă cu days+slots, sau veche
// listă simplă de sloturi) într-un draft consistent pentru UI.
function normalizeSchedule(raw: unknown, platform: string): { days: number[]; slots: string[] } {
  if (Array.isArray(raw)) {
    return { days: [...ALL_DAYS], slots: raw.map(fmtTime) }
  }
  if (raw && typeof raw === "object") {
    const obj = raw as { days?: number[]; slots?: TimeSlot[] }
    return {
      days: obj.days && obj.days.length > 0 ? obj.days : [...ALL_DAYS],
      slots: (obj.slots && obj.slots.length > 0 ? obj.slots : defaultSlotsFor(platform)).map(fmtTime),
    }
  }
  return { days: [...ALL_DAYS], slots: defaultSlotsFor(platform).map(fmtTime) }
}

export default function BestTimesPage() {
  const { data: session } = useSession()
  const token = (session?.user as { accessToken?: string })?.accessToken ?? ""
  const { activeOrgId: orgId } = useOrg()

  const [platforms, setPlatforms] = useState<string[]>([])
  const [draft, setDraft] = useState<Record<string, { days: number[]; slots: string[] }>>({})
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!orgId || !token) return
    setLoading(true)
    Promise.all([
      fetch(`${API}/api/v1/orgs/${orgId}/social-accounts`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json()).catch(() => []),
      fetch(`${API}/api/v1/orgs/${orgId}/best-times`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json()).catch(() => ({})),
    ]).then(([accounts, bestTimes]: [Array<{ platform: string; is_active: boolean }>, Record<string, unknown>]) => {
      const activePlatforms = Array.from(
        new Set((Array.isArray(accounts) ? accounts : []).filter((a) => a.is_active).map((a) => a.platform))
      )
      setPlatforms(activePlatforms)
      const d: Record<string, { days: number[]; slots: string[] }> = {}
      for (const p of activePlatforms) d[p] = normalizeSchedule(bestTimes?.[p], p)
      setDraft(d)
      setLoading(false)
    })
  }, [orgId, token])

  const save = async () => {
    const payload: BestTimes = {}
    for (const p of platforms) {
      const parsed = (draft[p]?.slots || []).map(parseTime).filter(Boolean) as TimeSlot[]
      if (parsed.length === 0) { toast.error(`${p}: cel puțin un slot obligatoriu`); return }
      if (!draft[p]?.days?.length) { toast.error(`${p}: alege cel puțin o zi`); return }
      payload[p] = { days: draft[p].days, slots: parsed }
    }
    setBusy(true)
    const res = await fetch(`${API}/api/v1/orgs/${orgId}/best-times`, {
      method: "PUT", headers, body: JSON.stringify(payload),
    })
    setBusy(false)
    if (res.ok) toast.success("Best times salvate!")
    else toast.error("Eroare la salvare")
  }

  const updateSlot = (platform: string, idx: number, value: string) => {
    setDraft((d) => ({ ...d, [platform]: { ...d[platform], slots: d[platform].slots.map((v, i) => i === idx ? value : v) } }))
  }
  const addSlot = (platform: string) => {
    setDraft((d) => ({ ...d, [platform]: { ...d[platform], slots: [...d[platform].slots, "09:00"] } }))
  }
  const removeSlot = (platform: string, idx: number) => {
    setDraft((d) => ({ ...d, [platform]: { ...d[platform], slots: d[platform].slots.filter((_, i) => i !== idx) } }))
  }
  const toggleDay = (platform: string, day: number) => {
    setDraft((d) => {
      const current = d[platform].days
      const next = current.includes(day) ? current.filter((x) => x !== day) : [...current, day].sort()
      return { ...d, [platform]: { ...d[platform], days: next } }
    })
  }
  const reset = (platform: string) => {
    setDraft((d) => ({ ...d, [platform]: { days: [...ALL_DAYS], slots: defaultSlotsFor(platform).map(fmtTime) } }))
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Se încarcă...</div>
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Best time to post</h1>
        <Button size="sm" disabled={busy} onClick={save}>{busy ? "Salvare..." : "Salvează"}</Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Orele sunt UTC. Rețelele afișate sunt cele conectate și active în{" "}
        <a href="/dashboard/settings/social-accounts" className="underline">Conturi sociale</a>.
        Bifează zilele din săptămână eligibile pentru fiecare rețea — sistemul programează
        postările în prima zi/oră liberă dintre cele bifate, aceeași zi pe toate rețelele
        selectate la postare, fiecare la propriul best time.
      </p>

      {platforms.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Niciun conector activ încă — conectează o rețea din{" "}
          <a href="/dashboard/settings/social-accounts" className="underline">Conturi sociale</a>.
        </p>
      )}

      {platforms.map((platform) => (
        <Card key={platform}>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base capitalize">{platform}</CardTitle>
            <button onClick={() => reset(platform)} className="text-xs text-muted-foreground hover:text-foreground underline">
              Reset
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Zile eligibile */}
            <div className="flex items-center gap-1">
              {ALL_DAYS.map((day) => {
                const checked = draft[platform]?.days?.includes(day)
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(platform, day)}
                    title={WEEKDAY_NAMES[day]}
                    className={`h-8 w-8 rounded-md border text-xs font-medium transition-colors ${
                      checked ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground"
                    }`}
                  >
                    {WEEKDAY_LABELS[day]}
                  </button>
                )
              })}
            </div>

            {/* Sloturi orare */}
            <div className="flex flex-wrap gap-2 items-center">
              {(draft[platform]?.slots || []).map((slot, idx) => (
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
                    disabled={(draft[platform]?.slots || []).length <= 1}
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
