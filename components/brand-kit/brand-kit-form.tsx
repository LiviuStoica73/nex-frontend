"use client"

import { useEffect, useRef, useState } from "react"
import { Save, Upload, FileText, Trash2, Link, RefreshCw, X } from "lucide-react"

interface BrandKit {
  brand_name: string | null
  description: string | null
  slogan: string | null
  logo_url: string | null
  sign_url: string | null
  logo_sign_url: string | null
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  background_color: string | null
  text_dark_color: string | null
  text_light_color: string | null
  brand_voice: string | null
  keywords: string[]
  avoid_words: string[]
  visual_templates: string[]
  // Tipografie
  title_font: string | null
  title_font_size: string | null
  title_bold: string | null
  title_italic: string | null
  title_color: string | null
  subtitle_font: string | null
  subtitle_font_size: string | null
  subtitle_bold: string | null
  subtitle_italic: string | null
  subtitle_color: string | null
  text_bg_color: string | null
}

interface RagDoc {
  id: string
  filename: string
  file_type: string
  chunk_count: number
  status: "processing" | "indexed" | "failed"
  created_at: string
}

const STATUS_ICON: Record<RagDoc["status"], string> = {
  processing: "⏳",
  indexed: "✅",
  failed: "❌",
}

type Tab = "identitate" | "voce" | "tipografie" | "documente"

interface Props { orgId: string; token: string }

export function BrandKitForm({ orgId, token }: Props) {
  const [tab, setTab] = useState<Tab>("identitate")

  const [kit, setKit] = useState<BrandKit>({
    brand_name: null, description: null, slogan: null,
    logo_url: null, sign_url: null, logo_sign_url: null,
    primary_color: "#000000", secondary_color: "#ffffff",
    accent_color: "#3B82F6", background_color: "#ffffff",
    text_dark_color: "#111111", text_light_color: "#ffffff",
    brand_voice: null,
    keywords: [], avoid_words: [], visual_templates: [],
    title_font: null, title_font_size: null, title_bold: null,
    title_italic: null, title_color: null,
    subtitle_font: null, subtitle_font_size: null, subtitle_bold: null,
    subtitle_italic: null, subtitle_color: null, text_bg_color: null,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingSign, setUploadingSign] = useState(false)
  const [uploadingLogoSign, setUploadingLogoSign] = useState(false)
  const [uploadingTemplate, setUploadingTemplate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [keywordsInput, setKeywordsInput] = useState("")
  const [avoidInput, setAvoidInput] = useState("")

  const [docs, setDocs] = useState<RagDoc[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [urlName, setUrlName] = useState("")
  const [addingUrl, setAddingUrl] = useState(false)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [querying, setQuerying] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/brand/kit`)
      .then((r) => r.json())
      .then((data) => {
        setKit({ ...data, visual_templates: data.visual_templates || [] })
        setKeywordsInput((data.keywords || []).join(", "))
        setAvoidInput((data.avoid_words || []).join(", "))
      })
      .catch(() => {})

    fetchDocs()
  }, [orgId])

  const fetchDocs = async () => {
    setLoadingDocs(true)
    const res = await fetch(`/api/brand/rag`)
    if (res.ok) setDocs(await res.json())
    setLoadingDocs(false)
  }

  const save = async () => {
    if (!orgId) { setError("Sesiunea nu are orgId. Re-autentifică-te."); return }
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch(`/api/brand/kit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: kit.brand_name,
          description: kit.description,
          slogan: kit.slogan,
          primary_color: kit.primary_color,
          secondary_color: kit.secondary_color,
          accent_color: kit.accent_color,
          background_color: kit.background_color,
          text_dark_color: kit.text_dark_color,
          text_light_color: kit.text_light_color,
          brand_voice: kit.brand_voice,
          keywords: keywordsInput.split(",").map((k) => k.trim()).filter(Boolean),
          avoid_words: avoidInput.split(",").map((k) => k.trim()).filter(Boolean),
          title_font: kit.title_font,
          title_font_size: kit.title_font_size,
          title_bold: kit.title_bold,
          title_italic: kit.title_italic,
          title_color: kit.title_color,
          subtitle_font: kit.subtitle_font,
          subtitle_font_size: kit.subtitle_font_size,
          subtitle_bold: kit.subtitle_bold,
          subtitle_italic: kit.subtitle_italic,
          subtitle_color: kit.subtitle_color,
          text_bg_color: kit.text_bg_color,
        }),
      })
      if (!res.ok) setError(`Eroare ${res.status}: ${await res.text()}`)
      else setSaved(true)
    } catch {
      setError("Eroare de rețea. Verifică conexiunea.")
    } finally {
      setSaving(false)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const uploadLogo = async (file: File) => {
    if (!orgId) { setError("Sesiunea nu are orgId. Re-autentifică-te."); return }
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(`/api/brand/logo`, { method: "POST", body: form })
      if (res.ok) {
        const data = await res.json()
        setKit((k) => ({ ...k, logo_url: data.logo_url }))
      } else {
        let msg = `Upload logo eșuat (${res.status})`
        try {
          const body = await res.json()
          msg = res.status === 503 ? "Storage R2 nu este configurat." : (body.detail ?? msg)
        } catch {}
        setError(msg)
      }
    } catch {
      setError("Eroare de rețea la upload logo.")
    } finally {
      setUploading(false)
    }
  }

  const uploadSign = async (file: File) => {
    if (!orgId) { setError("Sesiunea nu are orgId. Re-autentifică-te."); return }
    setUploadingSign(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(`/api/brand/sign`, { method: "POST", body: form })
      if (res.ok) {
        const data = await res.json()
        setKit((k) => ({ ...k, sign_url: data.sign_url }))
      } else {
        setError(`Upload sign eșuat (${res.status})`)
      }
    } catch {
      setError("Eroare de rețea la upload sign.")
    } finally {
      setUploadingSign(false)
    }
  }

  const uploadLogoSign = async (file: File) => {
    if (!orgId) { setError("Sesiunea nu are orgId. Re-autentifică-te."); return }
    setUploadingLogoSign(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(`/api/brand/logo-sign`, { method: "POST", body: form })
      if (res.ok) {
        const data = await res.json()
        setKit((k) => ({ ...k, logo_sign_url: data.logo_sign_url }))
      } else {
        setError(`Upload logo+sign eșuat (${res.status})`)
      }
    } catch {
      setError("Eroare de rețea la upload logo+sign.")
    } finally {
      setUploadingLogoSign(false)
    }
  }

  const uploadTemplates = async (files: FileList) => {
    setUploadingTemplate(true)
    setError(null)
    try {
      let lastKit: any = null
      for (const file of Array.from(files)) {
        const form = new FormData()
        form.append("file", file)
        const res = await fetch(`/api/brand/templates`, { method: "POST", body: form })
        if (res.ok) {
          lastKit = await res.json()
        } else {
          setError(`Upload template eșuat (${res.status})`)
          break
        }
      }
      if (lastKit) setKit((k) => ({ ...k, visual_templates: lastKit.visual_templates || [] }))
    } catch {
      setError("Eroare de rețea la upload template.")
    } finally {
      setUploadingTemplate(false)
    }
  }

  const deleteTemplate = async (idx: number) => {
    // Optimistic update imediat — nu așteptăm răspunsul serverului
    setKit((k) => ({ ...k, visual_templates: [...k.visual_templates.filter((_, i) => i !== idx)] }))
    await fetch(`/api/brand/templates/${idx}`, { method: "DELETE" })
  }

  const pollUntilIndexed = async () => {
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 3000))
      const res = await fetch(`/api/brand/rag`)
      if (!res.ok) break
      const list: RagDoc[] = await res.json()
      setDocs(list)
      if (list.every((d) => d.status !== "processing")) break
    }
  }

  const uploadDocs = async (files: FileList) => {
    setUploadingDoc(true)
    const form = new FormData()
    for (const file of Array.from(files)) form.append("file", file)
    await fetch(`/api/brand/rag`, { method: "POST", body: form })
    await fetchDocs()
    setUploadingDoc(false)
    pollUntilIndexed()
  }

  const addUrl = async () => {
    if (!urlInput.trim()) return
    setAddingUrl(true)
    await fetch(`/api/brand/rag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: urlInput, filename: urlName || undefined }),
    })
    setUrlInput("")
    setUrlName("")
    await fetchDocs()
    setAddingUrl(false)
    pollUntilIndexed()
  }

  const deleteDoc = async (id: string) => {
    await fetch(`/api/brand/rag/${id}`, { method: "DELETE" })
    setDocs((d) => d.filter((doc) => doc.id !== id))
  }

  const queryRag = async () => {
    if (!question.trim()) return
    setQuerying(true)
    setAnswer("")
    const res = await fetch(`/api/brand/rag/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    })
    if (res.ok) {
      const data = await res.json()
      setAnswer(data.answer)
    }
    setQuerying(false)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "identitate",  label: "Identitate" },
    { id: "voce",        label: "Voce & Cuvinte" },
    { id: "tipografie",  label: "Tipografie" },
    { id: "documente",   label: "Documente AI" },
  ]

  const FONT_OPTIONS = [
    "Inter", "Roboto", "Open Sans", "Lato", "Montserrat",
    "Poppins", "Raleway", "Oswald", "Playfair Display",
    "Merriweather", "Ubuntu", "Nunito", "Source Sans Pro",
  ]

  const colorFields = [
    { label: "Primară",      desc: "Culoarea principală a brandului",         key: "primary_color" },
    { label: "Secundară",    desc: "Culoare de suport / fundal secundar",      key: "secondary_color" },
    { label: "Accent",       desc: "CTA-uri, butoane, highlight-uri",          key: "accent_color" },
    { label: "Fundal",       desc: "Culoarea de fundal a imaginilor",          key: "background_color" },
    { label: "Text închis",  desc: "Text pe fundal deschis",                   key: "text_dark_color" },
    { label: "Text deschis", desc: "Text pe fundal închis",                    key: "text_light_color" },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Identitate ─────────────────────────────────────────────────── */}
      {tab === "identitate" && (
        <div className="space-y-6">
          {/* Nume, slogan, descriere */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Denumire firmă / brand</label>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Ex: Nex-Nex, Agenția Creativă, TechStartup SRL"
                value={kit.brand_name || ""}
                onChange={(e) => setKit((k) => ({ ...k, brand_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Slogan</label>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Ex: AI Content Copilot pentru creatori"
                value={kit.slogan || ""}
                onChange={(e) => setKit((k) => ({ ...k, slogan: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Descriere scurtă</label>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none min-h-[80px]"
                placeholder="1-3 propoziții despre ce face brandul tău."
                value={kit.description || ""}
                onChange={(e) => setKit((k) => ({ ...k, description: e.target.value }))}
              />
            </div>
          </div>

          {/* Logo + Sign */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <h2 className="font-semibold">Active vizuale</h2>
            <div className="grid grid-cols-2 gap-6">
              {/* Logo */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Logo</label>
                <p className="text-xs text-muted-foreground">Imagine pătrat 1:1, fundal transparent</p>
                {kit.logo_url && (
                  <img src={kit.logo_url} alt="Logo" className="h-20 w-20 rounded border bg-muted object-contain p-2" />
                )}
                <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm w-fit hover:bg-muted">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Se uploadează..." : kit.logo_url ? "Schimbă logo" : "Upload logo"}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                </label>
              </div>

              {/* Sign */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sign / Font brand</label>
                <p className="text-xs text-muted-foreground">Stilul de scriere al brandului (PNG/SVG)</p>
                {kit.sign_url && (
                  <img src={kit.sign_url} alt="Sign" className="h-20 w-auto max-w-[160px] rounded border bg-muted object-contain p-2" />
                )}
                <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm w-fit hover:bg-muted">
                  <Upload className="h-4 w-4" />
                  {uploadingSign ? "Se uploadează..." : kit.sign_url ? "Schimbă sign" : "Upload sign"}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadSign(e.target.files[0])} />
                </label>
              </div>
            </div>

            {/* Logo + Sign combinat */}
            <div className="border-t pt-4 space-y-2">
              <label className="text-sm font-medium">Logo + Sign combinat</label>
              <p className="text-xs text-muted-foreground">
                Un singur fișier cu logo și sign împreună — folosit când bifezi ambele în Telegram.
                Creează-l în Canva/Figma și uploadează-l aici.
              </p>
              {kit.logo_sign_url && (
                <img src={kit.logo_sign_url} alt="Logo+Sign" className="h-20 w-auto max-w-[240px] rounded border bg-muted object-contain p-2" />
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm w-fit hover:bg-muted">
                <Upload className="h-4 w-4" />
                {uploadingLogoSign ? "Se uploadează..." : kit.logo_sign_url ? "Schimbă logo+sign" : "Upload logo+sign"}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadLogoSign(e.target.files[0])} />
              </label>
            </div>
          </div>

          {/* Culori */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <h2 className="font-semibold">Culori brand</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {colorFields.map(({ label, desc, key }) => (
                <div key={key} className="space-y-1">
                  <label className="text-sm font-medium">{label}</label>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={(kit as any)[key] || "#000000"}
                      onChange={(e) => setKit((k) => ({ ...k, [key]: e.target.value }))}
                      className="h-9 w-9 cursor-pointer rounded border p-0.5"
                    />
                    <input
                      type="text"
                      value={(kit as any)[key] || ""}
                      onChange={(e) => setKit((k) => ({ ...k, [key]: e.target.value }))}
                      className="w-24 rounded border bg-background px-2 py-1.5 text-sm font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Template-uri */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold">Template-uri postări</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Imaginile de fundal / machetele vizuale ale brandului. AI-ul le va folosi la generarea de imagini pentru postări.
              </p>
            </div>

            {/* Grid thumbnailuri */}
            {kit.visual_templates.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {kit.visual_templates.map((url, idx) => (
                  <div key={url} className="group">
                    <div className="relative w-full h-48 rounded border bg-muted flex items-center justify-center overflow-hidden">
                      <img
                        src={url}
                        alt={`Template ${idx + 1}`}
                        className="max-w-full max-h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => deleteTemplate(idx)}
                          className="rounded-full bg-destructive p-1.5 text-white hover:bg-destructive/80"
                          title="Șterge template"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-center text-muted-foreground">Template {idx + 1}</p>
                  </div>
                ))}
              </div>
            )}

            <label className="flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm w-fit hover:bg-muted">
              <Upload className="h-4 w-4" />
              {uploadingTemplate ? "Se uploadează..." : "Adaugă template"}
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => e.target.files?.length && uploadTemplates(e.target.files)} />
            </label>
          </div>

          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            <Save className="h-4 w-4" />
            {saving ? "Se salvează..." : saved ? "✅ Salvat!" : "Salvează"}
          </button>
        </div>
      )}

      {/* ── Tab: Voce & Cuvinte ─────────────────────────────────────────────── */}
      {tab === "voce" && (
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <h2 className="font-semibold">Brand Voice</h2>
            <p className="text-sm text-muted-foreground">
              Descrie tonul, valorile și publicul țintă. AI-ul va folosi asta la fiecare generare.
            </p>
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none min-h-[140px]"
              placeholder="Ex: Ton profesional dar prietenos. Audiență: antreprenori 25-45 ani. Valori: inovație, eficiență, transparență. Evităm jargon tehnic excesiv."
              value={kit.brand_voice || ""}
              onChange={(e) => setKit((k) => ({ ...k, brand_voice: e.target.value }))}
            />
          </div>

          <div className="rounded-lg border bg-card p-5 space-y-4">
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
            {saving ? "Se salvează..." : saved ? "✅ Salvat!" : "Salvează"}
          </button>
        </div>
      )}

      {/* ── Tab: Tipografie ─────────────────────────────────────────────────── */}
      {tab === "tipografie" && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Setările de tipografie sunt folosite la generarea imaginilor cu <strong>Produs în template</strong> și la <strong>Text pe imagine</strong>.
          </p>

          {/* Titlu */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <h2 className="font-semibold">Titlu</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Font</label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={kit.title_font || ""}
                  onChange={(e) => setKit((k) => ({ ...k, title_font: e.target.value || null }))}
                >
                  <option value="">— Default (Inter) —</option>
                  {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Dimensiune (px)</label>
                <input
                  type="number" min={12} max={120}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="48"
                  value={kit.title_font_size || ""}
                  onChange={(e) => setKit((k) => ({ ...k, title_font_size: e.target.value || null }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={kit.title_bold === "true"}
                  onChange={(e) => setKit((k) => ({ ...k, title_bold: e.target.checked ? "true" : "false" }))}
                  className="h-4 w-4 rounded border"
                />
                <span className="text-sm font-bold">Bold</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={kit.title_italic === "true"}
                  onChange={(e) => setKit((k) => ({ ...k, title_italic: e.target.checked ? "true" : "false" }))}
                  className="h-4 w-4 rounded border"
                />
                <span className="text-sm italic">Italic</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Culoare</label>
                <input
                  type="color"
                  value={kit.title_color || "#1A1A1A"}
                  onChange={(e) => setKit((k) => ({ ...k, title_color: e.target.value }))}
                  className="h-9 w-9 cursor-pointer rounded border p-0.5"
                />
                <input
                  type="text"
                  value={kit.title_color || ""}
                  onChange={(e) => setKit((k) => ({ ...k, title_color: e.target.value || null }))}
                  className="w-24 rounded border bg-background px-2 py-1.5 text-sm font-mono"
                  placeholder="#1A1A1A"
                />
              </div>
            </div>
          </div>

          {/* Subtitlu */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <h2 className="font-semibold">Subtitlu / Preț</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Font</label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={kit.subtitle_font || ""}
                  onChange={(e) => setKit((k) => ({ ...k, subtitle_font: e.target.value || null }))}
                >
                  <option value="">— Default (Inter) —</option>
                  {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Dimensiune (px)</label>
                <input
                  type="number" min={12} max={120}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="32"
                  value={kit.subtitle_font_size || ""}
                  onChange={(e) => setKit((k) => ({ ...k, subtitle_font_size: e.target.value || null }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={kit.subtitle_bold === "true"}
                  onChange={(e) => setKit((k) => ({ ...k, subtitle_bold: e.target.checked ? "true" : "false" }))}
                  className="h-4 w-4 rounded border"
                />
                <span className="text-sm font-bold">Bold</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={kit.subtitle_italic === "true"}
                  onChange={(e) => setKit((k) => ({ ...k, subtitle_italic: e.target.checked ? "true" : "false" }))}
                  className="h-4 w-4 rounded border"
                />
                <span className="text-sm italic">Italic</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Culoare</label>
                <input
                  type="color"
                  value={kit.subtitle_color || "#555555"}
                  onChange={(e) => setKit((k) => ({ ...k, subtitle_color: e.target.value }))}
                  className="h-9 w-9 cursor-pointer rounded border p-0.5"
                />
                <input
                  type="text"
                  value={kit.subtitle_color || ""}
                  onChange={(e) => setKit((k) => ({ ...k, subtitle_color: e.target.value || null }))}
                  className="w-24 rounded border bg-background px-2 py-1.5 text-sm font-mono"
                  placeholder="#555555"
                />
              </div>
            </div>
          </div>

          {/* Fundal bandă text overlay */}
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <h2 className="font-semibold">Fundal text overlay</h2>
            <p className="text-sm text-muted-foreground">
              Culoarea benzii semi-transparente din spatele textului scris pe imagine. Poți include alpha (ex: <code className="font-mono text-xs bg-muted px-1 rounded">#00000088</code>).
            </p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={(kit.text_bg_color || "#000000").slice(0, 7)}
                onChange={(e) => setKit((k) => ({ ...k, text_bg_color: e.target.value }))}
                className="h-9 w-9 cursor-pointer rounded border p-0.5"
              />
              <input
                type="text"
                value={kit.text_bg_color || ""}
                onChange={(e) => setKit((k) => ({ ...k, text_bg_color: e.target.value || null }))}
                className="w-32 rounded border bg-background px-2 py-1.5 text-sm font-mono"
                placeholder="#00000088"
              />
            </div>
          </div>

          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            <Save className="h-4 w-4" />
            {saving ? "Se salvează..." : saved ? "✅ Salvat!" : "Salvează"}
          </button>
        </div>
      )}

      {/* ── Tab: Documente AI ───────────────────────────────────────────────── */}
      {tab === "documente" && (
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold">Documente despre brand</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Uploadează manuale, FAQ-uri, prezentări sau pagini web. AI-ul le va folosi ca referință la generare — prețuri corecte, features reale, zero hallucinations.
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md,.xlsx" multiple className="hidden"
                onChange={(e) => e.target.files?.length && uploadDocs(e.target.files)} />
              <button onClick={() => fileRef.current?.click()} disabled={uploadingDoc}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                <Upload className="h-4 w-4" />
                {uploadingDoc ? "Se procesează..." : "Upload PDF / DOCX / TXT"}
              </button>
            </div>

            <div className="flex gap-2">
              <input className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="https://site-ul-tau.com/despre" value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addUrl()} />
              <input className="w-36 rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="Nume (opțional)" value={urlName}
                onChange={(e) => setUrlName(e.target.value)} />
              <button onClick={addUrl} disabled={addingUrl || !urlInput.trim()}
                className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50">
                <Link className="h-4 w-4" />
                {addingUrl ? "..." : "Adaugă URL"}
              </button>
            </div>
          </div>

          <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">Documente indexate ({docs.length})</h2>
              <button onClick={fetchDocs} className="text-muted-foreground hover:text-foreground">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            {loadingDocs ? (
              <p className="p-4 text-sm text-muted-foreground">Se încarcă...</p>
            ) : docs.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Niciun document. Uploadează un fișier sau adaugă un URL.
              </p>
            ) : (
              <ul className="divide-y">
                {docs.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{doc.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {STATUS_ICON[doc.status]} {doc.status} · {doc.chunk_count} chunks · {doc.file_type.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => deleteDoc(doc.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border bg-card p-5 space-y-3">
            <h2 className="font-semibold">Testează — ce știe AI-ul despre brandul tău?</h2>
            <div className="flex gap-2">
              <input className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                placeholder='Ex: "Care sunt prețurile?" sau "Ce produse vindem?"'
                value={question} onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && queryRag()} />
              <button onClick={queryRag} disabled={querying || !question.trim()}
                className="rounded-md border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50">
                {querying ? "⏳" : "Întreabă"}
              </button>
            </div>
            {answer && (
              <div className="rounded-md border bg-muted/40 p-3 text-sm leading-relaxed">
                {answer}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
