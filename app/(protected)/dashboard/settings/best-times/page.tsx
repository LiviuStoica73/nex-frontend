"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useOrg } from "@/contexts/org-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const API = process.env.NEXT_PUBLIC_API_URL || ""

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"]
const WEEKDAY_NAMES = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"]
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

type TimeSlot = [number, number]
type PlatformSchedule = { days: number[]; slots: TimeSlot[] }
type BestTimes = Record<string, PlatformSchedule>

// Default-urile sunt în UTC — valori recomandate pentru audiență europeană
const DEFAULT_SLOTS_UTC: Record<string, TimeSlot[]> = {
  instagram: [[6, 0], [9, 0]],
  linkedin:  [[5, 0], [9, 0]],
  facebook:  [[6, 0], [10, 0]],
  x:         [[6, 0], [14, 0]],
  bluesky:   [[6, 0], [15, 0]],
  discord:   [[9, 0], [16, 0]],
  threads:   [[6, 0], [15, 0]],
  tiktok:    [[9, 0], [16, 0]],
  youtube:   [[11, 0], [14, 0]],
  pinterest: [[6, 0], [15, 0]],
  blog:      [[5, 0], [11, 0]],
}

function defaultSlotsUtcFor(platform: string): TimeSlot[] {
  return DEFAULT_SLOTS_UTC[platform] || [[6, 0], [15, 0]]
}

// Offset-ul browserului în minute față de UTC (ex: UTC+3 → -180)
function getBrowserOffsetMinutes(): number {
  return new Date().getTimezoneOffset() // negativ pentru est
}

// Convertește [h, m] UTC → [h, m] local
function utcToLocal([h, m]: TimeSlot): TimeSlot {
  const offsetMin = -getBrowserOffsetMinutes() // UTC+3 → +180
  const totalMin = h * 60 + m + offsetMin
  const wrapped = ((totalMin % 1440) + 1440) % 1440
  return [Math.floor(wrapped / 60), wrapped % 60]
}

// Convertește [h, m] local → [h, m] UTC
function localToUtc([h, m]: TimeSlot): TimeSlot {
  const offsetMin = -getBrowserOffsetMinutes()
  const totalMin = h * 60 + m - offsetMin
  const wrapped = ((totalMin % 1440) + 1440) % 1440
  return [Math.floor(wrapped / 60), wrapped % 60]
}

function fmtTime([h, m]: TimeSlot) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function parseTime(str: string): TimeSlot | null {
  const [h, m] = str.split(":").map(Number)
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null
  return [h, m]
}

// Primește date UTC din backend, normalizează și convertește la ora locală pentru UI
function normalizeScheduleToLocal(raw: unknown, platform: string): { days: number[]; slots: string[] } {
  let utcSlots: TimeSlot[]
  let days: number[]

  if (Array.isArray(raw)) {
    days = [...ALL_DAYS]
    utcSlots = raw as TimeSlot[]
  } else if (raw && typeof raw === "object") {
    const obj = raw as { days?: number[]; slots?: TimeSlot[] }
    days = obj.days && obj.days.length > 0 ? obj.days : [...ALL_DAYS]
    utcSlots = obj.slots && obj.slots.length > 0 ? obj.slots : defaultSlotsUtcFor(platform)
  } else {
    days = [...ALL_DAYS]
    utcSlots = defaultSlotsUtcFor(platform)
  }

  return {
    days,
    slots: utcSlots.map((s) => fmtTime(utcToLocal(s))),
  }
}

function getTimezoneLabel(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const offset = -getBrowserOffsetMinutes()
    const sign = offset >= 0 ? "+" : "-"
    const h = Math.floor(Math.abs(offset) / 60)
    const m = Math.abs(offset) % 60
    const offsetStr = m > 0 ? `${sign}${h}:${String(m).padStart(2, "0")}` : `${sign}${h}`
    return `${tz} (UTC${offsetStr})`
  } catch {
    return "ora locală"
  }
}

export default function BestTimesPage() {
  const { data: session } = useSession()
  const token = (session?.user as { accessToken?: string })?.accessToken ?? ""
  const { activeOrgId: orgId } = useOrg()

  const [platforms, setPlatforms] = useState<string[]>([])
  const [draft, setDraft] = useState<Record<string, { days: number[]; slots: string[] }>>({})
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tzLabel, setTzLabel] = useState("ora locală")

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` }

  useEffect(() => {
    setTzLabel(getTimezoneLabel())
  }, [])

  useEffect(() => {
    if (!orgId || !token) return
    setLoading(true)
    Promise.all([
      fetch(`${API}/api/v1/orgs/${orgId}/social-accounts`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json()).catch(() => []),
      fetch(`${API}/api/v1/orgs/${orgId}/best-times`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json()).catch(() => ({})),
      fetch(`${API}/api/v1/orgs/${orgId}/blog-connectors`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json()).catch(() => []),
    ]).then(([accounts, bestTimes, blogConnectors]: [
      Array<{ platform: string; is_active: boolean }>,
      Record<string, unknown>,
      Array<{ is_active: boolean }>,
    ]) => {
      const activePlatforms = Array.from(
        new Set((Array.isArray(accounts) ? accounts : []).filter((a) => a.is_active).map((a) => a.platform))
      )
      if ((Array.isArray(blogConnectors) ? blogConnectors : []).some((c) => c.is_active)) {
        activePlatforms.push("blog")
      }
      setPlatforms(activePlatforms)
      const d: Record<string, { days: number[]; slots: string[] }> = {}
      for (const p of activePlatforms) d[p] = normalizeScheduleToLocal(bestTimes?.[p], p)
      setDraft(d)
      setLoading(false)
    })
  }, [orgId, token])

  const save = async () => {
    const payload: BestTimes = {}
    for (const p of platforms) {
      const localSlots = (draft[p]?.slots || []).map(parseTime).filter(Boolean) as TimeSlot[]
      if (localSlots.length === 0) { toast.error(`${p}: cel puțin un slot obligatoriu`); return }
      if (!draft[p]?.days?.length) { toast.error(`${p}: alege cel puțin o zi`); return }
      // Convertim ora locală → UTC înainte de salvare
      const utcSlots = localSlots.map(localToUtc)
      payload[p] = { days: draft[p].days, slots: utcSlots }
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
    const utcDefaults = defaultSlotsUtcFor(platform)
    const localSlots = utcDefaults.map((s) => fmtTime(utcToLocal(s)))
    setDraft((d) => ({ ...d, [platform]: { days: [0, 1, 2, 3, 4], slots: localSlots } }))
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
        Orele sunt afișate în <strong>{tzLabel}</strong> — se salvează automat în UTC.
        Rețelele afișate sunt cele conectate și active în{" "}
        <a href="/dashboard/settings/social-accounts" className="underline">Conturi sociale</a>.
        Bifează zilele din săptămână eligibile — sistemul programează postările în prima zi/oră
        liberă, aceeași zi pe toate rețelele, fiecare la propriul best time.
      </p>

      {platforms.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Niciun conector activ — conectează o rețea din{" "}
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
