"use client"

import { useEffect, useState } from "react"
import { api, PLATFORM_COLORS, STATUS_COLORS, type Campaign, type Platform, type Post } from "@/lib/api"
import { PlusIcon } from "lucide-react"

interface Props { orgId: string; token: string }

export function CampaignsList({ orgId, token }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [newTopic, setNewTopic] = useState("")
  const [creating, setCreating] = useState(false)
  const [generatePlatform, setGeneratePlatform] = useState<Platform>("instagram")
  const [generatedText, setGeneratedText] = useState("")
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    api.campaigns.list(orgId, token).then(setCampaigns).finally(() => setLoading(false))
  }, [orgId, token])

  const createCampaign = async () => {
    if (!newTopic.trim()) return
    setCreating(true)
    try {
      const campaign = await api.campaigns.create(orgId, { name: newTopic, topic: newTopic }, token)
      setCampaigns((prev) => [campaign, ...prev])
      setNewTopic("")
    } finally {
      setCreating(false)
    }
  }

  const generateText = async () => {
    if (!newTopic.trim()) return
    setGenerating(true)
    try {
      const result = await api.generate.text(orgId, { topic: newTopic, platform: generatePlatform }, token)
      setGeneratedText(result.text)
    } finally {
      setGenerating(false)
    }
  }

  const statusBadge = (status: Campaign["status"]) => (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? "#9CA3AF" }}>
      {status}
    </span>
  )

  if (loading) return <p className="text-muted-foreground">Se încarcă campaniile...</p>

  return (
    <div className="space-y-6">

      {/* Create + Generate panel */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h2 className="font-semibold">Postare nouă cu AI</h2>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            placeholder="Tema postării (ex: lansare produs nou)..."
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateText()}
          />
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={generatePlatform}
            onChange={(e) => setGeneratePlatform(e.target.value as Platform)}
          >
            {(["instagram", "facebook", "linkedin", "x", "discord", "blog"] as Platform[]).map((p) => (
              <option key={p} value={p}>{p.toUpperCase()}</option>
            ))}
          </select>
          <button
            onClick={generateText}
            disabled={generating || !newTopic.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:bg-primary/90"
          >
            {generating ? "⏳ Generez..." : "✨ Generează"}
          </button>
        </div>

        {generatedText && (
          <div className="space-y-2">
            <div className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
              {generatedText}
            </div>
            <div className="flex gap-2">
              <button
                onClick={createCampaign}
                disabled={creating}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {creating ? "Se salvează..." : "✅ Salvează campania"}
              </button>
              <button
                onClick={() => setGeneratedText("")}
                className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
              >
                ❌ Renunță
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Campaigns list */}
      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">Nicio campanie încă</p>
          <p className="text-sm">Scrie o temă mai sus și generează primul post.</p>
        </div>
      ) : (
        <div className="divide-y rounded-lg border bg-card">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{campaign.name}</p>
                {campaign.topic && (
                  <p className="text-sm text-muted-foreground line-clamp-1">{campaign.topic}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(campaign.created_at).toLocaleDateString("ro-RO")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(campaign.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
