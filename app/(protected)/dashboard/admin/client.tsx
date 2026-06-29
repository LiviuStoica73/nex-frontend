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
  is_agency: boolean
  agency_clients_count: number
  parent_agency_id: string | null
  parent_agency_name: string | null
}

interface Props {
  data: { overview?: Overview; orgs?: OrgRow[]; error?: string }
  token: string
  apiUrl: string
}

const PLANS = ["free", "starter", "pro", "agency", "agency_xl"]

function OrgTableRow({
  org, indent, headers, apiUrl, editCredits, setEditCredits, busy, setBusy, router,
}: {
  org: OrgRow
  indent: boolean
  headers: Record<string, string>
  apiUrl: string
  editCredits: Record<string, string>
  setEditCredits: (fn: (p: Record<string, string>) => Record<string, string>) => void
  busy: Record<string, boolean>
  setBusy: (fn: (p: Record<string, boolean>) => Record<string, boolean>) => void
  router: ReturnType<typeof useRouter>
}) {
  const setCredits = async () => {
    const credits = parseInt(editCredits[org.id] ?? "")
    if (isNaN(credits) || credits < 0) { toast.error("Introdu un număr valid"); return }
    setBusy((b) => ({ ...b, [org.id]: true }))
    const res = await fetch(`${apiUrl}/api/v1/admin/superadmin/orgs/${org.id}/set-credits`, {
      method: "POST", headers, body: JSON.stringify({ credits }),
    })
    setBusy((b) => ({ ...b, [org.id]: false }))
    if (res.ok) { toast.success("Credite actualizate"); router.refresh() }
    else toast.error("Eroare la setare credite")
  }

  const setPlan = async (plan: string) => {
    setBusy((b) => ({ ...b, [`plan_${org.id}`]: true }))
    const res = await fetch(`${apiUrl}/api/v1/admin/superadmin/orgs/${org.id}/set-plan`, {
      method: "POST", headers, body: JSON.stringify({ plan, reset_credits: false }),
    })
    setBusy((b) => ({ ...b, [`plan_${org.id}`]: false }))
    if (res.ok) { toast.success("Plan actualizat"); router.refresh() }
    else toast.error("Eroare la setare plan")
  }

  return (
    <tr className="border-b hover:bg-muted/20 transition-colors">
      <td className="px-3 py-2 font-medium whitespace-nowrap">
        <span className={indent ? "pl-6 text-muted-foreground" : ""}>
          {indent ? "↳ " : ""}{org.name}
          {org.is_agency && (
            <Badge variant="outline" className="ml-2 text-[10px] py-0 px-1 text-blue-600 border-blue-300">AG</Badge>
          )}
        </span>
      </td>
      <td className="px-3 py-2"><Badge variant="outline" className="text-xs">{org.plan}</Badge></td>
      <td className="px-3 py-2">
        <Badge variant={org.subscription_status === "active" ? "default" : "secondary"} className="text-xs">
          {org.subscription_status ?? "—"}
        </Badge>
      </td>
      <td className="px-3 py-2 text-right font-mono">{org.credits_remaining.toLocaleString()}</td>
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
            onKeyDown={(e) => e.key === "Enter" && setCredits()}
          />
          <Button size="sm" className="h-7 text-xs px-2" disabled={busy[org.id]} onClick={setCredits}>
            {busy[org.id] ? "…" : "Set"}
          </Button>
        </div>
      </td>
      <td className="px-3 py-2">
        <Select onValueChange={setPlan} disabled={busy[`plan_${org.id}`]}>
          <SelectTrigger className="h-7 w-28 text-xs"><SelectValue placeholder={org.plan} /></SelectTrigger>
          <SelectContent>
            {PLANS.map((p) => (
              <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
    </tr>
  )
}

function SectionHeader({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <tr className={`${color} border-b`}>
      <td colSpan={13} className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label} ({count})
      </td>
    </tr>
  )
}

export function SuperAdminClient({ data, token, apiUrl }: Props) {
  const router = useRouter()
  const [editCredits, setEditCredits] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<Record<string, boolean>>({})

  if (data.error) {
    return <div className="p-8 text-red-500 font-medium">⛔ {data.error}</div>
  }

  const { overview, orgs = [] } = data
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` }

  // Clasificare
  const agencies = orgs.filter((o) => o.is_agency)
  const agencyClientIds = new Set(orgs.filter((o) => o.parent_agency_id).map((o) => o.id))
  const standaloneClients = orgs.filter((o) => !o.is_agency && !o.parent_agency_id)

  const rowProps = { headers, apiUrl, editCredits, setEditCredits, busy, setBusy, router }

  const TABLE_HEADERS = ["Nume", "Plan", "Status", "Credite", "Membri", "Campanii", "Teme", "Posturi", "Publicate", "Texte AI", "Imagini AI", "Setat credite", "Plan nou"]

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Super-Admin</h1>

      {overview && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="text-center border-blue-200">
              <CardHeader className="pb-1 pt-4"><CardTitle className="text-xs text-muted-foreground">Agenții</CardTitle></CardHeader>
              <CardContent className="pb-4"><p className="text-2xl font-bold text-blue-600">{agencies.length}</p></CardContent>
            </Card>
            <Card className="text-center border-purple-200">
              <CardHeader className="pb-1 pt-4"><CardTitle className="text-xs text-muted-foreground">Clienți agenții</CardTitle></CardHeader>
              <CardContent className="pb-4"><p className="text-2xl font-bold text-purple-600">{agencyClientIds.size}</p></CardContent>
            </Card>
            <Card className="text-center border-green-200">
              <CardHeader className="pb-1 pt-4"><CardTitle className="text-xs text-muted-foreground">Clienți standalone</CardTitle></CardHeader>
              <CardContent className="pb-4"><p className="text-2xl font-bold text-green-600">{standaloneClients.length}</p></CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader className="pb-1 pt-4"><CardTitle className="text-xs text-muted-foreground">Utilizatori</CardTitle></CardHeader>
              <CardContent className="pb-4"><p className="text-2xl font-bold">{overview.total_users}</p></CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { label: "Campanii", value: overview.total_campaigns },
              { label: "Teme", value: overview.total_topics },
              { label: "Posturi totale", value: overview.total_posts },
              { label: "Publicate", value: overview.published_posts },
              { label: "Texte AI", value: overview.texts_generated },
              { label: "Imagini AI", value: overview.images_generated },
              { label: "Credite rămase", value: overview.total_credits_remaining },
            ].map(({ label, value }) => (
              <Card key={label} className="text-center">
                <CardHeader className="pb-1 pt-4"><CardTitle className="text-xs text-muted-foreground">{label}</CardTitle></CardHeader>
                <CardContent className="pb-4"><p className="text-2xl font-bold">{value.toLocaleString()}</p></CardContent>
              </Card>
            ))}
          </div>
        </>
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
                  {TABLE_HEADERS.map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agencies.length > 0 && (
                  <>
                    <SectionHeader label="🏢 Agenții" count={agencies.length} color="bg-blue-50/50 dark:bg-blue-950/20" />
                    {agencies.map((agency) => (
                      <>
                        <OrgTableRow key={agency.id} org={agency} indent={false} {...rowProps} />
                        {orgs
                          .filter((o) => o.parent_agency_id === agency.id)
                          .map((client) => (
                            <OrgTableRow key={client.id} org={client} indent={true} {...rowProps} />
                          ))}
                      </>
                    ))}
                  </>
                )}

                {standaloneClients.length > 0 && (
                  <>
                    <SectionHeader label="👤 Clienți standalone" count={standaloneClients.length} color="bg-green-50/50 dark:bg-green-950/20" />
                    {standaloneClients.map((org) => (
                      <OrgTableRow key={org.id} org={org} indent={false} {...rowProps} />
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
