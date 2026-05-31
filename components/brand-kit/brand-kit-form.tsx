"use client"

import { useEffect, useState } from "react"
import { Save, Upload } from "lucide-react"

interface BrandKit {
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  font_primary: string | null
  brand_voice: string | null
  keywords: string[]
  avoid_words: string[]
}

interface Props { orgId: string; token: string }

export function BrandKitForm({ orgId, token }: Props) {
  const [kit, setKit] = useState<BrandKit>({
    logo_url: null, primary_color: "#000000", secondary_color: "#ffffff",
    accent_color: "#3B82F6", font_primary: null, brand_voice: null,
    keywords: [], avoid_words: [],
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [keywordsInput, setKeywordsInput] = useState("")
  const [avoidInput, setAvoidInput] = useState("")
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

  useEffect(() => {
    fetch(`${API}/api/v1/orgs/${orgId}/brand-kit`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setKit(data)
        setKeywordsInput((data.keywords || []).join(", "))
        setAvoidInput((data.avoid_words || []).join(", "))
      })
      .catch(() => {})
  }, [orgId, token])

  const save = async () => {
    setSaving(true)
    setSaved(false)
    await fetch(`${API}/api/v1/orgs/${orgId}/brand-kit`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        ...kit,
        keywords: keywordsInput.split(",").map((k) => k.trim()).filter(Boolean),
        avoid_words: avoidInput.split(",").map((k) => k.trim()).filter(Boolean),
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const uploadLogo = async (file: File) => {
    setUploading(true)
    const form = new FormData()
    form.append("file", file)
    const res = await fetch(`${API}/api/v1/orgs/${orgId}/brand-kit/logo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (res.ok) {
      const data = await res.json()
      setKit((k) => ({ ...k, logo_url: data.logo_url }))
    }
    setUploading(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Logo */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="font-semibold">Logo</h2>
        {kit.logo_url && (
          <img src={kit.logo_url} alt="Logo" className="h-16 w-auto rounded border bg-muted object-contain p-2" />
        )}
        <label className="flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm w-fit hover:bg-muted">
          <Upload className="h-4 w-4" />
          {uploading ? "Se uploadează..." : "Upload logo PNG"}
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
        </label>
      </div>

      {/* Culori */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Culori brand</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Primară", key: "primary_color" },
            { label: "Secundară", key: "secondary_color" },
            { label: "Accent", key: "accent_color" },
          ].map(({ label, key }) => (
            <div key={key} className="space-y-1">
              <label className="text-sm text-muted-foreground">{label}</label>
              <div className="flex items-center gap-2">
                <input type="color" value={(kit as any)[key] || "#000000"}
                  onChange={(e) => setKit((k) => ({ ...k, [key]: e.target.value }))}
                  className="h-10 w-10 cursor-pointer rounded border p-0.5" />
                <input type="text" value={(kit as any)[key] || ""}
                  onChange={(e) => setKit((k) => ({ ...k, [key]: e.target.value }))}
                  className="w-24 rounded border bg-background px-2 py-1.5 text-sm font-mono" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brand Voice */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="font-semibold">Brand Voice</h2>
        <p className="text-sm text-muted-foreground">
          Descrie tonul, valorile și publicul țintă. AI-ul va folosi asta la fiecare generare.
        </p>
        <textarea
          className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none min-h-[120px]"
          placeholder="Ex: Ton profesional dar prietenos. Audiență: antreprenori 25-45 ani. Valori: inovație, eficiență, transparență. Evităm jargon tehnic excesiv."
          value={kit.brand_voice || ""}
          onChange={(e) => setKit((k) => ({ ...k, brand_voice: e.target.value }))}
        />
      </div>

      {/* Keywords */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="font-semibold">Cuvinte cheie & Cuvinte de evitat</h2>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Cuvinte cheie (separate cu virgulă)</label>
          <input className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="inovație, calitate, eficiență, rezultate"
            value={keywordsInput} onChange={(e) => setKeywordsInput(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Cuvinte de evitat</label>
          <input className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="ieftin, gratis, garantat 100%"
            value={avoidInput} onChange={(e) => setAvoidInput(e.target.value)} />
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
        <Save className="h-4 w-4" />
        {saving ? "Se salvează..." : saved ? "✅ Salvat!" : "Salvează Brand Kit"}
      </button>
    </div>
  )
}
