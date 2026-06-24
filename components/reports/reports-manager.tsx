"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"

interface NamedConsumed { name: string; consumed: number }
interface CampaignConsumed { campaign_id: string | null; name: string; consumed: number }
interface ActionConsumed { action: string; consumed: number }

interface OrgReport {
  period: string
  total_consumed: number
  by_campaign: CampaignConsumed[]
  by_action: ActionConsumed[]
}
interface AgencyReport {
  period: string
  agency_own_consumed: number
  clients_consumed: number
  clients: { org_id: string; name: string; consumed: number }[]
}

interface Props { orgId: string; token: string }

const ACTION_LABELS: Record<string, string> = {
  text_post: "Text",
  image_comfyui: "Imagine (RTX)",
  image_fal: "Imagine (Fal.ai)",
  image_fal_kontext: "Imagine (Kontext)",
  image_gemini: "Imagine (Gemini)",
  video: "Video",
  platform_adaptation: "Adaptare platformă",
  ideas_set: "Idei",
}

function lastMonths(n: number): string[] {
  const out: string[] = []
  const d = new Date()
  for (let i = 0; i < n; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
    d.setMonth(d.getMonth() - 1)
  }
  return out
}

export function ReportsManager({ orgId, token }: Props) {
  const [period, setPeriod] = useState(lastMonths(1)[0])
  const [org, setOrg] = useState<OrgReport | null>(null)
  const [agency, setAgency] = useState<AgencyReport | null>(null)
  const [loading, setLoading] = useState(true)

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"
  const headers = { Authorization: `Bearer ${token}` }
  const months = lastMonths(6)

  const fetchReports = async () => {
    setLoading(true)
    const orgRes = await fetch(
      `${API}/api/v1/orgs/${orgId}/reports/consumption?period=${period}`,
      { headers },
    )
    setOrg(orgRes.ok ? await orgRes.json() : null)

    // Rollup agenție — apare doar dacă org-ul activ e o agenție (altfel 400/403)
    const agRes = await fetch(
      `${API}/api/v1/orgs/${orgId}/reports/agency?period=${period}`,
      { headers },
    )
    setAgency(agRes.ok ? await agRes.json() : null)
    setLoading(false)
  }

  useEffect(() => { fetchReports() }, [orgId, period])

  const exportCsv = () => {
    const lines: string[] = [`Raport consum credite,${period}`, ""]
    if (agency) {
      lines.push("Client,Consumat")
      agency.clients.forEach((c) => lines.push(`${c.name},${c.consumed}`))
      lines.push(`Agenție (branduri proprii),${agency.agency_own_consumed}`, "")
    }
    if (org) {
      lines.push("Acțiune,Consumat")
      org.by_action.forEach((a) => lines.push(`${ACTION_LABELS[a.action] ?? a.action},${a.consumed}`))
      lines.push("", "Campanie,Consumat")
      org.by_campaign.forEach((c) => lines.push(`${c.name},${c.consumed}`))
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `raport-consum-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <select
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <button
          onClick={exportCsv}
          className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Se încarcă...</p>
      ) : (
        <>
          {/* Rollup agenție */}
          {agency && (
            <div className="rounded-lg border bg-card">
              <div className="border-b p-4">
                <h2 className="font-semibold">Consum per client (agenție)</h2>
                <p className="text-xs text-muted-foreground">
                  Clienți: {agency.clients_consumed} • Branduri proprii: {agency.agency_own_consumed}
                </p>
              </div>
              {agency.clients.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Niciun consum în această perioadă.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y">
                    {agency.clients.map((c) => (
                      <tr key={c.org_id}>
                        <td className="px-4 py-2">{c.name}</td>
                        <td className="px-4 py-2 text-right font-medium">{c.consumed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Consum org activ: pe acțiune + pe campanie */}
          {org && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border bg-card">
                <div className="border-b p-4">
                  <h2 className="font-semibold">Pe acțiune</h2>
                  <p className="text-xs text-muted-foreground">Total: {org.total_consumed} credite</p>
                </div>
                {org.by_action.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">Niciun consum.</p>
                ) : (
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      {org.by_action.map((a) => (
                        <tr key={a.action}>
                          <td className="px-4 py-2">{ACTION_LABELS[a.action] ?? a.action}</td>
                          <td className="px-4 py-2 text-right font-medium">{a.consumed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="rounded-lg border bg-card">
                <div className="border-b p-4"><h2 className="font-semibold">Pe campanie</h2></div>
                {org.by_campaign.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">Niciun consum.</p>
                ) : (
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      {org.by_campaign.map((c, i) => (
                        <tr key={c.campaign_id ?? `none-${i}`}>
                          <td className="px-4 py-2">{c.name}</td>
                          <td className="px-4 py-2 text-right font-medium">{c.consumed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Placeholder rezultate */}
          <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
            Rezultate (reach, afișări, engagement) — disponibile după implementarea analytics (Sprint 6).
          </div>
        </>
      )}
    </div>
  )
}
