"use client"

import { useEffect, useState } from "react"
import { Rss, Trash2, Plus, CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/components/dashboard/header"
import { useOrg } from "@/contexts/org-context"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"

interface BlogConnector {
  id: string
  name: string
  platform_type: string
  site_url: string | null
  api_url: string | null
  is_active: boolean
  last_tested_at: string | null
  last_test_ok: boolean | null
  created_at: string
}

const PLATFORM_LABELS: Record<string, string> = {
  wordpress: "WordPress",
  ghost: "Ghost CMS",
  custom_rest: "Custom REST API",
}

export default function BlogConnectorsPage() {
  const { data: session } = useSession()
  const { activeOrg } = useOrg()
  const token = (session?.user as any)?.accessToken
  const orgId = activeOrg?.id

  const [connectors, setConnectors] = useState<BlogConnector[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    platform_type: "wordpress",
    site_url: "",
    api_key: "",
    extra_config: {} as Record<string, any>,
  })

  useEffect(() => {
    if (orgId && token) fetchConnectors()
  }, [orgId, token])

  async function fetchConnectors() {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/orgs/${orgId}/blog-connectors`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setConnectors(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!form.name || !form.site_url || !form.api_key) return
    const res = await fetch(`${API_URL}/api/v1/orgs/${orgId}/blog-connectors`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: form.name,
        platform_type: form.platform_type,
        site_url: form.site_url,
        api_key: form.api_key,
        extra_config: form.extra_config,
      }),
    })
    if (res.ok) {
      setShowForm(false)
      setForm({ name: "", platform_type: "wordpress", site_url: "", api_key: "", extra_config: {} })
      fetchConnectors()
    }
  }

  async function handleTest(connectorId: string) {
    setTestingId(connectorId)
    try {
      const res = await fetch(
        `${API_URL}/api/v1/orgs/${orgId}/blog-connectors/${connectorId}/test`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      )
      if (res.ok) fetchConnectors()
    } finally {
      setTestingId(null)
    }
  }

  async function handleDelete(connectorId: string) {
    setDeletingId(connectorId)
    try {
      await fetch(`${API_URL}/api/v1/orgs/${orgId}/blog-connectors/${connectorId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchConnectors()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        heading="Blog Connectors"
        text="Conectează blogurile clienților tăi. Publică conținut direct din campaniile Nex-Nex."
      />

      <div className="flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)} size="sm">
          <Plus className="mr-2 size-4" />
          Adaugă conector blog
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-foreground">Conector nou</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted-foreground">Platformă</label>
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={form.platform_type}
                onChange={(e) => setForm((f) => ({ ...f, platform_type: e.target.value }))}
              >
                <option value="wordpress">WordPress</option>
                <option value="ghost">Ghost CMS</option>
                <option value="custom_rest">Custom REST API</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted-foreground">Nume afișat</label>
              <Input
                placeholder="ex: Blog AllMeters"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted-foreground">
                {form.platform_type === "custom_rest" ? "URL endpoint API" : "URL site"}
              </label>
              <Input
                placeholder={
                  form.platform_type === "wordpress"
                    ? "https://site-client.com"
                    : form.platform_type === "ghost"
                    ? "https://site-client.com"
                    : "https://api.site-client.com/blog"
                }
                value={form.site_url}
                onChange={(e) => setForm((f) => ({ ...f, site_url: e.target.value }))}
              />
              {form.platform_type === "custom_rest" && (
                <p className="text-xs text-muted-foreground">
                  Endpoint-ul care acceptă <code>POST</code> cu contractul Nex-Nex
                </p>
              )}
              {form.platform_type === "ghost" && (
                <p className="text-xs text-muted-foreground">
                  URL-ul rădăcină al site-ului Ghost (fără <code>/ghost/api/</code>)
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted-foreground">API Key</label>
              <Input
                type="password"
                placeholder={
                  form.platform_type === "ghost"
                    ? "Admin API Key — format: id:secret"
                    : form.platform_type === "custom_rest"
                    ? "X-Api-Key setat pe serverul clientului"
                    : "Din Settings → Nex-Nex Blog API în WordPress"
                }
                value={form.api_key}
                onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleCreate} size="sm">Salvează</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Anulează</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : connectors.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Rss className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Niciun conector blog. Adaugă primul pentru a publica pe bloguri.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {connectors.map((connector) => (
            <div
              key={connector.id}
              className="flex items-center justify-between rounded-xl border bg-card px-5 py-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <Rss className="size-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">{connector.name}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {PLATFORM_LABELS[connector.platform_type] || connector.platform_type}
                    </Badge>
                    {connector.site_url && (
                      <a
                        href={connector.site_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        {connector.site_url}
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                  {connector.last_tested_at && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      {connector.last_test_ok ? (
                        <CheckCircle2 className="size-3 text-green-500" />
                      ) : (
                        <XCircle className="size-3 text-red-500" />
                      )}
                      <span>
                        {connector.last_test_ok ? "Conexiune OK" : "Conexiune eșuată"} —{" "}
                        {new Date(connector.last_tested_at).toLocaleString("ro-RO")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest(connector.id)}
                  disabled={testingId === connector.id}
                >
                  {testingId === connector.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Testează"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(connector.id)}
                  disabled={deletingId === connector.id}
                >
                  {deletingId === connector.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
