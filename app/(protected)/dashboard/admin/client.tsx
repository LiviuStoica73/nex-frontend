"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface Overview {
  total_orgs: number
  total_users: number
  total_campaigns: number
  total_topics: number
  total_posts: number
  published_posts: number
  texts_generated: number
  images_generated: number
  total_credits_remaining: number
}

interface OrgRow {
  id: string
  name: string
  plan: string
  subscription_status: string | null
  credits_remaining: number
  members: number
  campaigns: number
  topics: number
  total_posts: number
  published_posts: number
  texts_generated: number
  images_generated: number
  created_at: string | null
}

interface Props {
  data: { overview?: Overview; orgs?: OrgRow[]; error?: string }
  token: string
  apiUrl: string
}

const STAT_CARDS = (o: Overview) => [
  { label: "Organizații", value: o.total_orgs },
  { label: "Utilizatori", value: o.total_users },
  { label: "Campanii", value: o.total_campaigns },
  { label: "Teme", value: o.total_topics },
  { label: "Posturi totale", value: o.total_posts },
  { label: "Publicate", value: o.published_posts },
  { label: "Texte generate", value: o.texts_generated },
  { label: "Imagini generate", value: o.images_generated },
  { label: "Credite rămase", value: o.total_credits_remaining },
]

export function SuperAdminClient({ data, token, apiUrl }: Props) {
  const router = useRouter()
  const [editCredits, setEditCredits] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<Record<string, boolean>>({})

  if (data.error) {
    return <div className="p-8 text-red-500 font-medium">⛔ {data.error}</div>
  }

  const { overview, orgs = [] } = data

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` }

  const setCredits = async (orgId: string) => {
    const credits = parseInt(editCredits[orgId] ?? "")
    if (isNaN(credits) || credits < 0) { toast.error("Introdu un număr valid de credite"); return }
    setBusy((b) => ({ ...b, [orgId]: true }))
    const res = await fetch(`${apiUrl}/api/v1/admin/superadmin/orgs/${orgId}/set-credits`, {
      method: "POST", headers, body: JSON.stringify({ credits }),
    })
    setBusy((b) => ({ ...b, [orgId]: false }))
    if (res.ok) { toast.success("Credite actualizate"); router.refresh() }
    else toast.error("Eroare la setare credite")
  }

  const setPlan = async (orgId: string, plan: string) => {
    setBusy((b) => ({ ...b, [`plan_${orgId}`]: true }))
    const res = await fetch(`${apiUrl}/api/v1/admin/superadmin/orgs/${orgId}/set-plan`, {
      method: "POST", headers, body: JSON.stringify({ plan, reset_credits: false }),
    })
    setBusy((b) => ({ ...b, [`plan_${orgId}`]: false }))
    if (res.ok) { toast.success("Plan actualizat"); router.refresh() }
    else toast.error("Eroare la setare plan")
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Super-Admin</h1>

      {overview && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {STAT_CARDS(overview).map(({ label, value }) => (
            <Card key={label} className="text-center">
              <CardHeader className="pb-1 pt-4">
                <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-2xl font-bold">{value.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Organizații ({orgs.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  {["Nume", "Plan", "Status", "Credite", "Membri", "Campanii", "Teme", "Posturi", "Publicate", "Texte AI", "Imagini AI", "Setat credite", "Plan nou"].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <tr key={org.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2 font-medium whitespace-nowrap">{org.name}</td>
                    <td className="px-3 py-2"><Badge variant="outline" className="text-xs">{org.plan}</Badge></td>
                    <td className="px-3 py-2">
                      <Badge variant={org.subscription_status === "active" ? "default" : "secondary"} className="text-xs">
                        {org.subscription_status ?? "—"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{org.credits_remaining}</td>
                    <td className="px-3 py-2 text-center">{org.members}</td>
                    <td className="px-3 py-2 text-center">{org.campaigns}</td>
                    <td className="px-3 py-2 text-center">{org.topics}</td>
                    <td className="px-3 py-2 text-center">{org.total_posts}</td>
                    <td className="px-3 py-2 text-center text-green-600 font-medium">{org.published_posts}</td>
                    <td className="px-3 py-2 text-center">{org.texts_generated}</td>
                    <td className="px-3 py-2 text-center">{org.images_generated}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 items-center">
                        <Input
                          type="number"
                          className="h-7 w-20 text-xs"
                          placeholder={String(org.credits_remaining)}
                          value={editCredits[org.id] ?? ""}
                          onChange={(e) => setEditCredits((p) => ({ ...p, [org.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && setCredits(org.id)}
                        />
                        <Button size="sm" className="h-7 text-xs px-2" disabled={busy[org.id]} onClick={() => setCredits(org.id)}>
                          {busy[org.id] ? "…" : "Set"}
                        </Button>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Select onValueChange={(v) => setPlan(org.id, v)} disabled={busy[`plan_${org.id}`]}>
                        <SelectTrigger className="h-7 w-28 text-xs"><SelectValue placeholder={org.plan} /></SelectTrigger>
                        <SelectContent>
                          {["free", "starter", "pro", "agency"].map((p) => (
                            <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
