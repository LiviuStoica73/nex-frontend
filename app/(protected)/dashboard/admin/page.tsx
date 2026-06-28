"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API = process.env.NEXT_PUBLIC_API_URL || ""

interface Overview {
  total_orgs: number
  total_users: number
  total_posts: number
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
  created_at: string | null
}

export default function SuperAdminPage() {
  const { data: session } = useSession()
  const token = (session?.user as { accessToken?: string })?.accessToken ?? ""
  const [overview, setOverview] = useState<Overview | null>(null)
  const [orgs, setOrgs] = useState<OrgRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [editCredits, setEditCredits] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<Record<string, boolean>>({})

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` }

  const load = async () => {
    const [ov, ol] = await Promise.all([
      fetch(`${API}/api/v1/admin/superadmin/overview`, { headers }).then((r) => r.json()),
      fetch(`${API}/api/v1/admin/superadmin/orgs`, { headers }).then((r) => r.json()),
    ])
    if (ov.detail) { setError(ov.detail); return }
    setOverview(ov)
    setOrgs(ol)
  }

  useEffect(() => { if (token) load() }, [token])

  const setCredits = async (orgId: string) => {
    const credits = parseInt(editCredits[orgId] ?? "")
    if (isNaN(credits)) return
    setBusy((b) => ({ ...b, [orgId]: true }))
    await fetch(`${API}/api/v1/admin/superadmin/orgs/${orgId}/set-credits`, {
      method: "POST", headers, body: JSON.stringify({ credits }),
    })
    setBusy((b) => ({ ...b, [orgId]: false }))
    await load()
  }

  const setPlan = async (orgId: string, plan: string) => {
    setBusy((b) => ({ ...b, [`plan_${orgId}`]: true }))
    await fetch(`${API}/api/v1/admin/superadmin/orgs/${orgId}/set-plan`, {
      method: "POST", headers, body: JSON.stringify({ plan, reset_credits: false }),
    })
    setBusy((b) => ({ ...b, [`plan_${orgId}`]: false }))
    await load()
  }

  if (error) return <div className="p-8 text-red-500">Acces interzis: {error}</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Super-Admin</h1>

      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Organizații", value: overview.total_orgs },
            { label: "Utilizatori", value: overview.total_users },
            { label: "Posturi totale", value: overview.total_posts },
            { label: "Credite rămase", value: overview.total_credits_remaining },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{value.toLocaleString()}</p></CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Organizații</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 pr-4">Nume</th>
                  <th className="text-left py-2 pr-4">Plan</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-right py-2 pr-4">Credite</th>
                  <th className="text-right py-2 pr-4">Membri</th>
                  <th className="text-right py-2 pr-4">Campanii</th>
                  <th className="text-left py-2 pr-4">Setat credite</th>
                  <th className="text-left py-2">Plan nou</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <tr key={org.id} className="border-b hover:bg-muted/30">
                    <td className="py-2 pr-4 font-medium">{org.name}</td>
                    <td className="py-2 pr-4"><Badge variant="outline">{org.plan}</Badge></td>
                    <td className="py-2 pr-4">
                      <Badge variant={org.subscription_status === "active" ? "default" : "secondary"}>
                        {org.subscription_status ?? "—"}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 text-right">{org.credits_remaining}</td>
                    <td className="py-2 pr-4 text-right">{org.members}</td>
                    <td className="py-2 pr-4 text-right">{org.campaigns}</td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-1">
                        <Input
                          className="h-7 w-24 text-xs"
                          placeholder="nr credite"
                          value={editCredits[org.id] ?? ""}
                          onChange={(e) => setEditCredits((p) => ({ ...p, [org.id]: e.target.value }))}
                        />
                        <Button size="sm" className="h-7 text-xs" disabled={busy[org.id]} onClick={() => setCredits(org.id)}>
                          Setează
                        </Button>
                      </div>
                    </td>
                    <td className="py-2">
                      <Select onValueChange={(v) => setPlan(org.id, v)} disabled={busy[`plan_${org.id}`]}>
                        <SelectTrigger className="h-7 w-32 text-xs"><SelectValue placeholder={org.plan} /></SelectTrigger>
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
