"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Save, Upload, FileText, Trash2, Link, RefreshCw, X, Building2 } from "lucide-react"

const POSITION_OPTIONS = [
  { value: "top_left",    labelKey: "positions.top_left" },
  { value: "top_center",  labelKey: "positions.top_center" },
  { value: "top_right",   labelKey: "positions.top_right" },
  { value: "mid_left",    labelKey: "positions.mid_left" },
  { value: "center",      labelKey: "positions.center" },
  { value: "mid_right",   labelKey: "positions.mid_right" },
  { value: "bot_left",    labelKey: "positions.bot_left" },
  { value: "bot_center",  labelKey: "positions.bot_center" },
  { value: "bot_right",   labelKey: "positions.bot_right" },
] as const


function PositionSelect({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (v: string) => void
  label: string
}) {
  const t = useTranslations("brand_kit_form")
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
      <select
        value={value || "bot_right"}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs border rounded px-2 py-1 bg-background text-foreground"
      >
        {POSITION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(opt.labelKey)}
          </option>
        ))}
      </select>
    </div>
  )
}

interface BrandKit {
  brand_name: string | null
  description: string | null
  slogan: string | null
  logo_url: string | null
  sign_url: string | null
  logo_sign_url: string | null
  logo_position: string | null
  sign_position: string | null
  logo_sign_position: string | null
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
  // Quick Post Defaults
  qp_default_provider: string
  qp_default_platforms: string[]
  qp_default_tone: string
  qp_default_logo: boolean
  qp_default_sign: boolean
  qp_default_logo_sign: boolean
  qp_default_template: boolean
  qp_default_schedule_mode: string
  qp_default_image_direction: string
  qp_default_image_format: string
  qp_image_format_instructions: Record<string, string>
  qp_custom_image_format: string
  qp_custom_image_direction: string
  qp_custom_tone: string
  qp_default_use_emoji: boolean
  qp_default_use_hashtags: boolean
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

type Tab = "identitate" | "voce" | "tipografie" | "documente" | "quick_post"

interface Props { orgId: string; token: string }

export function BrandKitForm({ orgId, token }: Props) {
  const t = useTranslations("brand_kit_form")
  if (!orgId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
        <Building2 className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="font-medium">{t("no_brand.title")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("no_brand.description")}
          </p>
        </div>
      </div>
    )
  }

  const searchParams = useSearchParams()
  const VALID_BRAND_TABS: Tab[] = ["identitate", "voce", "tipografie", "documente", "quick_post"]
  const tabFromUrl = searchParams.get("tab") as Tab | null
  const [tab, setTab] = useState<Tab>(
    tabFromUrl && VALID_BRAND_TABS.includes(tabFromUrl) ? tabFromUrl : "identitate"
  )

  useEffect(() => {
    const t = searchParams.get("tab") as Tab | null
    if (t && VALID_BRAND_TABS.includes(t)) setTab(t)
  }, [searchParams])

  const [kit, setKit] = useState<BrandKit>({
    brand_name: null, description: null, slogan: null,
    logo_url: null, sign_url: null, logo_sign_url: null,
    logo_position: "bot_right" as string,
    sign_position: "bot_center" as string,
    logo_sign_position: "bot_right" as string,
    primary_color: "#000000", secondary_color: "#ffffff",
    accent_color: "#3B82F6", background_color: "#ffffff",
    text_dark_color: "#111111", text_light_color: "#ffffff",
    brand_voice: null,
    keywords: [], avoid_words: [], visual_templates: [],
    title_font: null, title_font_size: null, title_bold: null,
    title_italic: null, title_color: null,
    subtitle_font: null, subtitle_font_size: null, subtitle_bold: null,
    subtitle_italic: null, subtitle_color: null, text_bg_color: null,
    qp_default_provider: "comfyui",
    qp_default_platforms: [],
    qp_default_tone: "neutral",
    qp_default_logo: false,
    qp_default_sign: false,
    qp_default_logo_sign: false,
    qp_default_template: false,
    qp_default_schedule_mode: "best_time",
    qp_default_image_direction: "auto",
    qp_default_image_format: "square",
    qp_image_format_instructions: {},
    qp_custom_image_format: "",
    qp_custom_image_direction: "",
    qp_custom_tone: "",
    qp_default_use_emoji: true,
    qp_default_use_hashtags: true,
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
  const [previewTitle, setPreviewTitle] = useState("")
  const [previewSubtitle, setPreviewSubtitle] = useState("")
  const [previewOverlay, setPreviewOverlay] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  // Încarcă fonturile reale (aceleași bundle-uite pe server pentru Pillow) o
  // singură dată, ca preview-ul din tab-ul Tipografie să fie fidel rezultatului.
  useEffect(() => {
    const id = "nexnex-typography-fonts"
    if (document.getElementById(id)) return
    const link = document.createElement("link")
    link.id = id
    link.rel = "stylesheet"
    link.href = "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,700;1,400;1,700&family=Roboto:ital,wght@0,400;0,700;1,400;1,700&family=Montserrat:ital,wght@0,400;0,700;1,400;1,700&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap"
    document.head.appendChild(link)
  }, [])

  useEffect(() => {
    fetch(`/api/brand/kit`)
      .then((r) => r.json())
      .then((data) => {
        setKit({
          ...data,
          visual_templates: data.visual_templates || [],
          qp_default_provider: data.qp_default_provider || "comfyui",
          qp_default_platforms: data.qp_default_platforms || [],
          qp_default_tone: data.qp_default_tone || "neutral",
          qp_default_logo: data.qp_default_logo ?? false,
          qp_default_sign: data.qp_default_sign ?? false,
          qp_default_logo_sign: data.qp_default_logo_sign ?? false,
          qp_default_template: data.qp_default_template ?? false,
          qp_default_schedule_mode: data.qp_default_schedule_mode || "best_time",
          qp_default_image_direction: data.qp_default_image_direction || "auto",
          qp_default_image_format: data.qp_default_image_format || "square",
          qp_image_format_instructions: data.qp_image_format_instructions || {},
          qp_custom_image_format: data.qp_custom_image_format || "",
          qp_custom_image_direction: data.qp_custom_image_direction || "",
          qp_custom_tone: data.qp_custom_tone || "",
          qp_default_use_emoji: data.qp_default_use_emoji ?? true,
          qp_default_use_hashtags: data.qp_default_use_hashtags ?? true,
          logo_position: data.logo_position ?? "bot_right",
          sign_position: data.sign_position ?? "bot_center",
          logo_sign_position: data.logo_sign_position ?? "bot_right",
        })
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
    if (!orgId) { setError(t("errors.missing_org")); return }
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
          qp_default_provider: kit.qp_default_provider,
          qp_default_platforms: kit.qp_default_platforms,
          qp_default_tone: kit.qp_default_tone,
          qp_default_logo: kit.qp_default_logo,
          qp_default_sign: kit.qp_default_sign,
          qp_default_logo_sign: kit.qp_default_logo_sign,
          qp_default_template: kit.qp_default_template,
          qp_default_schedule_mode: kit.qp_default_schedule_mode,
          qp_default_image_direction: kit.qp_default_image_direction,
          qp_default_image_format: kit.qp_default_image_format,
          qp_image_format_instructions: kit.qp_image_format_instructions,
          qp_custom_image_format: kit.qp_custom_image_format,
          qp_custom_image_direction: kit.qp_custom_image_direction,
          qp_custom_tone: kit.qp_custom_tone,
          qp_default_use_emoji: kit.qp_default_use_emoji,
          qp_default_use_hashtags: kit.qp_default_use_hashtags,
          logo_position: kit.logo_position,
          sign_position: kit.sign_position,
          logo_sign_position: kit.logo_sign_position,
        }),
      })
      if (!res.ok) setError(t("errors.save_failed", { status: res.status, message: await res.text() }))
      else setSaved(true)
    } catch {
      setError(t("errors.network"))
    } finally {
      setSaving(false)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const uploadLogo = async (file: File) => {
    if (!orgId) { setError(t("errors.missing_org")); return }
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
        let msg = t("errors.logo_upload_failed", { status: res.status })
        try {
          const body = await res.json()
          msg = res.status === 503 ? t("errors.storage_not_configured") : (body.detail ?? msg)
        } catch {}
        setError(msg)
      }
    } catch {
      setError(t("errors.logo_network"))
    } finally {
      setUploading(false)
    }
  }

  const uploadSign = async (file: File) => {
    if (!orgId) { setError(t("errors.missing_org")); return }
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
        setError(t("errors.sign_upload_failed", { status: res.status }))
      }
    } catch {
      setError(t("errors.sign_network"))
    } finally {
      setUploadingSign(false)
    }
  }

  const uploadLogoSign = async (file: File) => {
    if (!orgId) { setError(t("errors.missing_org")); return }
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
        setError(t("errors.logo_sign_upload_failed", { status: res.status }))
      }
    } catch {
      setError(t("errors.logo_sign_network"))
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
          setError(t("errors.template_upload_failed", { status: res.status }))
          break
        }
      }
      if (lastKit) setKit((k) => ({ ...k, visual_templates: lastKit.visual_templates || [] }))
    } catch {
      setError(t("errors.template_network"))
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
    { id: "identitate",  label: t("tabs.identity") },
    { id: "voce",        label: t("tabs.voice") },
    { id: "tipografie",  label: t("tabs.typography") },
    { id: "documente",   label: t("tabs.documents") },
    { id: "quick_post",  label: t("tabs.quick_post") },
  ]

  // Doar fonturi bundle-uite fizic pe server (app/assets/fonts/) — orice altă
  // valoare cade pe Inter la generare, deci nu le mai oferim ca opțiuni false.
  const FONT_OPTIONS = ["Inter", "Roboto", "Montserrat", "Playfair Display"]

  const colorFields = [
    { label: t("identity.colors.primary.label"),      desc: t("identity.colors.primary.description"),      key: "primary_color" },
    { label: t("identity.colors.secondary.label"),    desc: t("identity.colors.secondary.description"),    key: "secondary_color" },
    { label: t("identity.colors.accent.label"),       desc: t("identity.colors.accent.description"),       key: "accent_color" },
    { label: t("identity.colors.background.label"),   desc: t("identity.colors.background.description"),   key: "background_color" },
    { label: t("identity.colors.text_dark.label"),    desc: t("identity.colors.text_dark.description"),    key: "text_dark_color" },
    { label: t("identity.colors.text_light.label"),   desc: t("identity.colors.text_light.description"),   key: "text_light_color" },
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
              <label className="text-sm text-muted-foreground">{t("identity.brand_name.label")}</label>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder={t("identity.brand_name.placeholder")}
                value={kit.brand_name || ""}
                onChange={(e) => setKit((k) => ({ ...k, brand_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t("identity.slogan.label")}</label>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder={t("identity.slogan.placeholder")}
                value={kit.slogan || ""}
                onChange={(e) => setKit((k) => ({ ...k, slogan: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t("identity.description.label")}</label>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none min-h-[80px]"
                placeholder={t("identity.description.placeholder")}
                value={kit.description || ""}
                onChange={(e) => setKit((k) => ({ ...k, description: e.target.value }))}
              />
            </div>
          </div>

          {/* Logo + Sign */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <h2 className="font-semibold">{t("identity.visual_assets.title")}</h2>
            <div className="grid grid-cols-2 gap-6">
              {/* Logo */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("identity.logo.label")}</label>
                <p className="text-xs text-muted-foreground">{t("identity.logo.description")}</p>
                {kit.logo_url && (
                  <img src={kit.logo_url} alt={t("identity.logo.alt")} className="h-20 w-20 rounded border bg-muted object-contain p-2" />
                )}
                <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm w-fit hover:bg-muted">
                  <Upload className="h-4 w-4" />
                  {uploading ? t("identity.logo.uploading") : kit.logo_url ? t("identity.logo.replace") : t("identity.logo.upload")}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                </label>
                <PositionSelect
                  value={kit.logo_position || "bot_right"}
                  onChange={(v) => setKit((k) => ({ ...k, logo_position: v }))}
                  label={t("position_label")}
                />
              </div>

              {/* Sign */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("identity.sign.label")}</label>
                <p className="text-xs text-muted-foreground">{t("identity.sign.description")}</p>
                {kit.sign_url && (
                  <img src={kit.sign_url} alt={t("identity.sign.alt")} className="h-20 w-auto max-w-[160px] rounded border bg-muted object-contain p-2" />
                )}
                <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm w-fit hover:bg-muted">
                  <Upload className="h-4 w-4" />
                  {uploadingSign ? t("identity.sign.uploading") : kit.sign_url ? t("identity.sign.replace") : t("identity.sign.upload")}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadSign(e.target.files[0])} />
                </label>
                <PositionSelect
                  value={kit.sign_position || "bot_center"}
                  onChange={(v) => setKit((k) => ({ ...k, sign_position: v }))}
                  label={t("position_label")}
                />
              </div>
            </div>

            {/* Logo + Sign combinat */}
            <div className="border-t pt-4 space-y-2">
              <label className="text-sm font-medium">{t("identity.logo_sign.label")}</label>
              <p className="text-xs text-muted-foreground">
                {t("identity.logo_sign.description")}
              </p>
              {kit.logo_sign_url && (
                <img src={kit.logo_sign_url} alt={t("identity.logo_sign.alt")} className="h-20 w-auto max-w-[240px] rounded border bg-muted object-contain p-2" />
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm w-fit hover:bg-muted">
                <Upload className="h-4 w-4" />
                {uploadingLogoSign ? t("identity.logo_sign.uploading") : kit.logo_sign_url ? t("identity.logo_sign.replace") : t("identity.logo_sign.upload")}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadLogoSign(e.target.files[0])} />
              </label>
              <PositionSelect
                value={kit.logo_sign_position || "bot_right"}
                onChange={(v) => setKit((k) => ({ ...k, logo_sign_position: v }))}
                label={t("position_label")}
              />
            </div>
          </div>

          {/* Culori */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <h2 className="font-semibold">{t("identity.colors.title")}</h2>
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
              <h2 className="font-semibold">{t("identity.templates.title")}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("identity.templates.description")}
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
                        alt={t("identity.templates.alt", { index: idx + 1 })}
                        className="max-w-full max-h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => deleteTemplate(idx)}
                          className="rounded-full bg-destructive p-1.5 text-white hover:bg-destructive/80"
                          title={t("identity.templates.delete")}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-center text-muted-foreground">{t("identity.templates.item_label", { index: idx + 1 })}</p>
                  </div>
                ))}
              </div>
            )}

            <label className="flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm w-fit hover:bg-muted">
              <Upload className="h-4 w-4" />
              {uploadingTemplate ? t("identity.templates.uploading") : t("identity.templates.add")}
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => e.target.files?.length && uploadTemplates(e.target.files)} />
            </label>
          </div>

          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            <Save className="h-4 w-4" />
            {saving ? t("common.saving") : saved ? t("common.saved") : t("common.save")}
          </button>
        </div>
      )}

      {/* ── Tab: Voce & Cuvinte ─────────────────────────────────────────────── */}
      {tab === "voce" && (
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <h2 className="font-semibold">{t("voice.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("voice.description")}
            </p>
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none min-h-[140px]"
              placeholder={t("voice.placeholder")}
              value={kit.brand_voice || ""}
              onChange={(e) => setKit((k) => ({ ...k, brand_voice: e.target.value }))}
            />
          </div>

          <div className="rounded-lg border bg-card p-5 space-y-4">
            <h2 className="font-semibold">{t("voice.keywords.title")}</h2>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t("voice.keywords.label")}</label>
              <input className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder={t("voice.keywords.placeholder")}
                value={keywordsInput} onChange={(e) => setKeywordsInput(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t("voice.avoid_words.label")}</label>
              <input className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder={t("voice.avoid_words.placeholder")}
                value={avoidInput} onChange={(e) => setAvoidInput(e.target.value)} />
            </div>
          </div>

          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            <Save className="h-4 w-4" />
            {saving ? t("common.saving") : saved ? t("common.saved") : t("common.save")}
          </button>
        </div>
      )}

      {/* ── Tab: Tipografie ─────────────────────────────────────────────────── */}
      {tab === "tipografie" && (
        <div className="space-y-8">
          <p className="text-sm text-muted-foreground">
            {t("typography.description_prefix")} <strong>{t("typography.description_product_template")}</strong> {t("typography.description_middle")} <strong>{t("typography.description_text_on_image")}</strong>.
          </p>

          {/* ══════════════════ Secțiune: Produs în template ══════════════════ */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t("typography.product_template.title")}</h2>

            {/* Preview live — fontul e cel real folosit și de generatorul de imagini */}
            <div
              className="rounded-lg border p-6 space-y-2"
              style={{ backgroundColor: kit.background_color || "#FFFFFF" }}
            >
              <p
                style={{
                  fontFamily: `"${kit.title_font || "Inter"}", sans-serif`,
                  fontSize: `${Number(kit.title_font_size) || 48}px`,
                  fontWeight: kit.title_bold === "true" ? 700 : 400,
                  fontStyle: kit.title_italic === "true" ? "italic" : "normal",
                  color: kit.title_color || "#1A1A1A",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                {previewTitle || t("typography.product_template.preview_title")}
              </p>
              <p
                style={{
                  fontFamily: `"${kit.subtitle_font || "Inter"}", sans-serif`,
                  fontSize: `${Number(kit.subtitle_font_size) || 32}px`,
                  fontWeight: kit.subtitle_bold === "true" ? 700 : 400,
                  fontStyle: kit.subtitle_italic === "true" ? "italic" : "normal",
                  color: kit.subtitle_color || "#555555",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                {previewSubtitle || t("typography.product_template.preview_subtitle")}
              </p>
              <p className="text-xs text-muted-foreground pt-2">
                {t("typography.product_template.preview_description")}
              </p>
            </div>

            {/* Texte de test — doar pentru preview, nu se salvează */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">{t("typography.product_template.test_title_label")}</label>
                <input
                  type="text"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder={t("typography.product_template.test_title_placeholder")}
                  value={previewTitle}
                  onChange={(e) => setPreviewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">{t("typography.product_template.test_subtitle_label")}</label>
                <input
                  type="text"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder={t("typography.product_template.test_subtitle_placeholder")}
                  value={previewSubtitle}
                  onChange={(e) => setPreviewSubtitle(e.target.value)}
                />
              </div>
            </div>

            {/* Titlu */}
            <div className="rounded-lg border bg-card p-5 space-y-4">
              <h3 className="font-semibold">{t("typography.title_block.title")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">{t("typography.font")}</label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={kit.title_font || ""}
                    onChange={(e) => setKit((k) => ({ ...k, title_font: e.target.value || null }))}
                  >
                    <option value="">{t("typography.default_font")}</option>
                    {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">{t("typography.size")}</label>
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
                  <span className="text-sm font-bold">{t("typography.bold")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={kit.title_italic === "true"}
                    onChange={(e) => setKit((k) => ({ ...k, title_italic: e.target.checked ? "true" : "false" }))}
                    className="h-4 w-4 rounded border"
                  />
                  <span className="text-sm italic">{t("typography.italic")}</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">{t("typography.color")}</label>
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
              <h3 className="font-semibold">{t("typography.subtitle_block.title")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">{t("typography.font")}</label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={kit.subtitle_font || ""}
                    onChange={(e) => setKit((k) => ({ ...k, subtitle_font: e.target.value || null }))}
                  >
                    <option value="">{t("typography.default_font")}</option>
                    {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">{t("typography.size")}</label>
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
                  <span className="text-sm font-bold">{t("typography.bold")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={kit.subtitle_italic === "true"}
                    onChange={(e) => setKit((k) => ({ ...k, subtitle_italic: e.target.checked ? "true" : "false" }))}
                    className="h-4 w-4 rounded border"
                  />
                  <span className="text-sm italic">{t("typography.italic")}</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">{t("typography.color")}</label>
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
          </div>

          {/* ══════════════════ Secțiune: Text pe imagine ══════════════════ */}
          <div className="space-y-4 border-t pt-6">
            <h2 className="text-lg font-semibold">{t("typography.text_on_image.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("typography.text_on_image.description_prefix")} <strong>{t("typography.title_block.title")}</strong> {t("typography.text_on_image.description_suffix")}
            </p>

            {/* Text de test */}
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">{t("typography.text_on_image.test_label")}</label>
              <input
                type="text"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder={t("typography.text_on_image.test_placeholder")}
                value={previewOverlay}
                onChange={(e) => setPreviewOverlay(e.target.value)}
              />
            </div>

            {/* Preview pe fundal deschis și închis, ca să se vadă contrastul automat */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { bg: "#E8E4D8", label: t("typography.text_on_image.light_background") },
                { bg: "#20281E", label: t("typography.text_on_image.dark_background") },
              ].map(({ bg, label }) => {
                const bandColor = kit.text_bg_color || "#00000088"
                const bandOpaqueColor = bandColor.length >= 8 ? `#${bandColor.slice(1, 7)}` : bandColor
                const bandAlpha = bandColor.length >= 9 ? parseInt(bandColor.slice(7, 9), 16) / 255 : 0.55
                // Contrast automat aproximativ (aceeași logică ca backend-ul: luminanță fundal+bandă)
                const hexToRgb = (hex: string) => {
                  const v = hex.replace("#", "")
                  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
                }
                const [br, bgc, bb] = hexToRgb(bg)
                const [rr, rg, rb] = hexToRgb(bandOpaqueColor.length === 7 ? bandOpaqueColor : "#000000")
                const luma = (0.299 * br + 0.587 * bgc + 0.114 * bb) * (1 - bandAlpha) +
                             (0.299 * rr + 0.587 * rg + 0.114 * rb) * bandAlpha
                const textColor = luma > 150 ? "#111111" : "#FFFFFF"
                return (
                  <div key={label} className="relative overflow-hidden rounded-lg border h-40" style={{ backgroundColor: bg }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 flex items-center justify-center px-3 py-3 text-center"
                      style={{ backgroundColor: bandColor.length >= 8 ? bandColor : `${bandColor}88` }}
                    >
                      <span
                        style={{
                          fontFamily: `"${kit.title_font || "Inter"}", sans-serif`,
                          fontStyle: kit.title_italic === "true" ? "italic" : "normal",
                          fontWeight: 700,
                          color: textColor,
                          fontSize: "15px",
                        }}
                      >
                        {previewOverlay || t("typography.text_on_image.test_placeholder")}
                      </span>
                    </div>
                    <span className="absolute top-2 left-2 text-[11px] text-muted-foreground bg-background/70 rounded px-1.5 py-0.5">
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Fundal bandă text overlay */}
            <div className="rounded-lg border bg-card p-5 space-y-3">
              <h3 className="font-semibold">{t("typography.overlay.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("typography.overlay.description_prefix")} <code className="font-mono text-xs bg-muted px-1 rounded">#00000088</code>{t("typography.overlay.description_suffix")}
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
          </div>

          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            <Save className="h-4 w-4" />
            {saving ? t("common.saving") : saved ? t("common.saved") : t("common.save")}
          </button>
        </div>
      )}

      {/* ── Tab: Documente AI ───────────────────────────────────────────────── */}
      {tab === "documente" && (
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold">{t("documents.brand_docs.title")}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("documents.brand_docs.description")}
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md,.xlsx" multiple className="hidden"
                onChange={(e) => e.target.files?.length && uploadDocs(e.target.files)} />
              <button onClick={() => fileRef.current?.click()} disabled={uploadingDoc}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                <Upload className="h-4 w-4" />
                {uploadingDoc ? t("documents.brand_docs.processing") : t("documents.brand_docs.upload")}
              </button>
            </div>

            <div className="flex gap-2">
              <input className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                placeholder={t("documents.url.placeholder")} value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addUrl()} />
              <input className="w-36 rounded-md border bg-background px-3 py-2 text-sm"
                placeholder={t("documents.url.name_placeholder")} value={urlName}
                onChange={(e) => setUrlName(e.target.value)} />
              <button onClick={addUrl} disabled={addingUrl || !urlInput.trim()}
                className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50">
                <Link className="h-4 w-4" />
                {addingUrl ? "..." : t("documents.url.add")}
              </button>
            </div>
          </div>

          <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">{t("documents.indexed.title", { count: docs.length })}</h2>
              <button onClick={fetchDocs} className="text-muted-foreground hover:text-foreground">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            {loadingDocs ? (
              <p className="p-4 text-sm text-muted-foreground">{t("documents.indexed.loading")}</p>
            ) : docs.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                {t("documents.indexed.empty")}
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
                          {STATUS_ICON[doc.status]} {t(`documents.status.${doc.status}`)} · {t("documents.indexed.chunks", { count: doc.chunk_count })} · {doc.file_type.toUpperCase()}
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
            <h2 className="font-semibold">{t("documents.test.title")}</h2>
            <div className="flex gap-2">
              <input className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                placeholder={t("documents.test.placeholder")}
                value={question} onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && queryRag()} />
              <button onClick={queryRag} disabled={querying || !question.trim()}
                className="rounded-md border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50">
                {querying ? "⏳" : t("documents.test.ask")}
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

      {/* ── Tab: Quick Post Defaults ─────────────────────────────────────────── */}
      {tab === "quick_post" && (
        <div className="space-y-6">

          {/* Generator imagini implicit */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold">{t("quick_post.provider.title")}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {t("quick_post.provider.description")}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { value: "comfyui", label: t("quick_post.provider.options.comfyui") },
                { value: "fal",     label: t("quick_post.provider.options.fal") },
                { value: "gemini",  label: t("quick_post.provider.options.gemini") },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="qp_default_provider"
                    value={value}
                    checked={kit.qp_default_provider === value}
                    onChange={() => setKit((k) => ({ ...k, qp_default_provider: value }))}
                    className="accent-primary"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ton implicit */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold">{t("quick_post.tone.title")}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {t("quick_post.tone.description")}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { value: "neutral",   label: t("quick_post.tone.options.neutral"),   desc: t("quick_post.tone.descriptions.neutral") },
                { value: "inspiring", label: t("quick_post.tone.options.inspiring"), desc: t("quick_post.tone.descriptions.inspiring") },
                { value: "formal",    label: t("quick_post.tone.options.formal"),    desc: t("quick_post.tone.descriptions.formal") },
                { value: "casual",    label: t("quick_post.tone.options.casual"),    desc: t("quick_post.tone.descriptions.casual") },
              ].map(({ value, label, desc }) => (
                <label
                  key={value}
                  className={`flex items-start gap-3 cursor-pointer rounded-md border p-3 transition-colors ${
                    kit.qp_default_tone === value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="qp_default_tone"
                    value={value}
                    checked={kit.qp_default_tone === value}
                    onChange={() => setKit((k) => ({ ...k, qp_default_tone: value }))}
                    className="accent-primary mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">{label}</span>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {/* Ton personalizat */}
            <div className={`rounded-md border p-3 transition-colors ${kit.qp_default_tone === "custom" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="qp_default_tone"
                  value="custom"
                  checked={kit.qp_default_tone === "custom"}
                  onChange={() => setKit((k) => ({ ...k, qp_default_tone: "custom" }))}
                  className="accent-primary mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium">{t("quick_post.custom")}</span>
                  <p className="text-xs text-muted-foreground">{t("quick_post.tone.custom_description")}</p>
                </div>
              </label>
              {kit.qp_default_tone === "custom" && (
                <textarea
                  rows={2}
                  placeholder={t("quick_post.tone.custom_placeholder")}
                  value={kit.qp_custom_tone}
                  onChange={(e) => setKit((k) => ({ ...k, qp_custom_tone: e.target.value }))}
                  className="mt-2 w-full rounded border border-input bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              )}
            </div>
          </div>

          {/* Format text */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold">{t("quick_post.text_format.title")}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {t("quick_post.text_format.description")}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kit.qp_default_use_emoji}
                  onChange={(e) => setKit((k) => ({ ...k, qp_default_use_emoji: e.target.checked }))}
                  className="accent-primary"
                />
                <div>
                  <span className="text-sm font-medium">{t("quick_post.text_format.emoji_label")}</span>
                  <p className="text-xs text-muted-foreground">{t("quick_post.text_format.emoji_description")}</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kit.qp_default_use_hashtags}
                  onChange={(e) => setKit((k) => ({ ...k, qp_default_use_hashtags: e.target.checked }))}
                  className="accent-primary"
                />
                <div>
                  <span className="text-sm font-medium">{t("quick_post.text_format.hashtags_label")}</span>
                  <p className="text-xs text-muted-foreground">{t("quick_post.text_format.hashtags_description")}</p>
                </div>
              </label>
            </div>
          </div>

          {/* Assets vizuale implicite */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold">{t("quick_post.visual_assets.title")}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {t("quick_post.visual_assets.description")}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kit.qp_default_logo}
                  onChange={(e) => setKit((k) => ({ ...k, qp_default_logo: e.target.checked }))}
                  className="accent-primary"
                />
                <div>
                  <span className="text-sm font-medium">{t("quick_post.visual_assets.logo")}</span>
                  {kit.logo_url
                    ? <span className="ml-2 text-xs text-muted-foreground">{t("quick_post.visual_assets.loaded")}</span>
                    : <span className="ml-2 text-xs text-destructive">{t("quick_post.visual_assets.logo_missing")}</span>
                  }
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kit.qp_default_sign}
                  onChange={(e) => setKit((k) => ({ ...k, qp_default_sign: e.target.checked }))}
                  className="accent-primary"
                />
                <div>
                  <span className="text-sm font-medium">{t("quick_post.visual_assets.sign")}</span>
                  {kit.sign_url
                    ? <span className="ml-2 text-xs text-muted-foreground">{t("quick_post.visual_assets.loaded")}</span>
                    : <span className="ml-2 text-xs text-destructive">{t("quick_post.visual_assets.sign_missing")}</span>
                  }
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kit.qp_default_logo_sign}
                  onChange={(e) => setKit((k) => ({ ...k, qp_default_logo_sign: e.target.checked }))}
                  className="accent-primary"
                />
                <div>
                  <span className="text-sm font-medium">{t("quick_post.visual_assets.logo_sign")}</span>
                  <span className="ml-1 text-xs text-muted-foreground">{t("quick_post.visual_assets.logo_sign_description")}</span>
                  {kit.logo_sign_url
                    ? <span className="ml-2 text-xs text-muted-foreground">{t("quick_post.visual_assets.loaded")}</span>
                    : <span className="ml-2 text-xs text-destructive">{t("quick_post.visual_assets.sign_missing")}</span>
                  }
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kit.qp_default_template}
                  onChange={(e) => setKit((k) => ({ ...k, qp_default_template: e.target.checked }))}
                  className="accent-primary"
                />
                <div>
                  <span className="text-sm font-medium">{t("quick_post.visual_assets.template")}</span>
                  {kit.visual_templates.length > 0
                    ? <span className="ml-2 text-xs text-muted-foreground">{kit.visual_templates.length === 1 ? t("quick_post.visual_assets.template_loaded_one") : t("quick_post.visual_assets.template_loaded_many", { count: kit.visual_templates.length })}</span>
                    : <span className="ml-2 text-xs text-destructive">{t("quick_post.visual_assets.template_missing")}</span>
                  }
                </div>
              </label>
            </div>
          </div>

          {/* Stil vizual implicit */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold">{t("quick_post.visual_style.title")}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {t("quick_post.visual_style.description_prefix")} <strong>{t("quick_post.visual_style.ai_decide")}</strong> {t("quick_post.visual_style.description_suffix")}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { value: "auto",         label: t("quick_post.visual_style.options.auto"),         desc: t("quick_post.visual_style.descriptions.auto") },
                { value: "clean",        label: t("quick_post.visual_style.options.clean"),        desc: t("quick_post.visual_style.descriptions.clean") },
                { value: "bold",         label: t("quick_post.visual_style.options.bold"),         desc: t("quick_post.visual_style.descriptions.bold") },
                { value: "professional", label: t("quick_post.visual_style.options.professional"), desc: t("quick_post.visual_style.descriptions.professional") },
                { value: "cinematic",    label: t("quick_post.visual_style.options.cinematic"),    desc: t("quick_post.visual_style.descriptions.cinematic") },
                { value: "minimal",      label: t("quick_post.visual_style.options.minimal"),      desc: t("quick_post.visual_style.descriptions.minimal") },
                { value: "energetic",    label: t("quick_post.visual_style.options.energetic"),    desc: t("quick_post.visual_style.descriptions.energetic") },
                { value: "elegant",      label: t("quick_post.visual_style.options.elegant"),      desc: t("quick_post.visual_style.descriptions.elegant") },
              ].map(({ value, label, desc }) => (
                <label
                  key={value}
                  className={`flex items-start gap-3 cursor-pointer rounded-md border p-3 transition-colors ${
                    kit.qp_default_image_direction === value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="qp_default_image_direction"
                    value={value}
                    checked={kit.qp_default_image_direction === value}
                    onChange={() => setKit((k) => ({ ...k, qp_default_image_direction: value }))}
                    className="accent-primary mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">{label}</span>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {/* Stil personalizat */}
            <div className={`rounded-md border p-3 transition-colors ${kit.qp_default_image_direction === "custom" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="qp_default_image_direction"
                  value="custom"
                  checked={kit.qp_default_image_direction === "custom"}
                  onChange={() => setKit((k) => ({ ...k, qp_default_image_direction: "custom" }))}
                  className="accent-primary mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium">{t("quick_post.custom")}</span>
                  <p className="text-xs text-muted-foreground">{t("quick_post.visual_style.custom_description")}</p>
                </div>
              </label>
              {kit.qp_default_image_direction === "custom" && (
                <textarea
                  rows={2}
                  placeholder={t("quick_post.visual_style.custom_placeholder")}
                  value={kit.qp_custom_image_direction}
                  onChange={(e) => setKit((k) => ({ ...k, qp_custom_image_direction: e.target.value }))}
                  className="mt-2 w-full rounded border border-input bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              )}
            </div>
          </div>

          {/* Format imagine implicit */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold">{t("quick_post.image_format.title")}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {t("quick_post.image_format.description")}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { value: "square",    label: t("quick_post.image_format.options.square"),    desc: t("quick_post.image_format.descriptions.square") },
                { value: "portrait",  label: t("quick_post.image_format.options.portrait"),  desc: t("quick_post.image_format.descriptions.portrait") },
                { value: "story",     label: t("quick_post.image_format.options.story"),     desc: t("quick_post.image_format.descriptions.story") },
                { value: "landscape", label: t("quick_post.image_format.options.landscape"), desc: t("quick_post.image_format.descriptions.landscape") },
                { value: "wide",      label: t("quick_post.image_format.options.wide"),      desc: t("quick_post.image_format.descriptions.wide") },
              ].map(({ value, label, desc }) => (
                <label
                  key={value}
                  className={`flex items-start gap-3 cursor-pointer rounded-md border p-3 transition-colors ${
                    kit.qp_default_image_format === value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="qp_default_image_format"
                    value={value}
                    checked={kit.qp_default_image_format === value}
                    onChange={() => setKit((k) => ({ ...k, qp_default_image_format: value }))}
                    className="accent-primary mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">{label}</span>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {/* Format personalizat */}
            <div className={`rounded-md border p-3 transition-colors ${kit.qp_default_image_format === "custom" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="qp_default_image_format"
                  value="custom"
                  checked={kit.qp_default_image_format === "custom"}
                  onChange={() => setKit((k) => ({ ...k, qp_default_image_format: "custom" }))}
                  className="accent-primary mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium">{t("quick_post.custom")}</span>
                  <p className="text-xs text-muted-foreground">{t("quick_post.image_format.custom_description")}</p>
                </div>
              </label>
              {kit.qp_default_image_format === "custom" && (
                <textarea
                  rows={2}
                  placeholder={t("quick_post.image_format.custom_placeholder")}
                  value={kit.qp_custom_image_format}
                  onChange={(e) => setKit((k) => ({ ...k, qp_custom_image_format: e.target.value }))}
                  className="mt-2 w-full rounded border border-input bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              )}
            </div>
          </div>

          {/* Programare implicită */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold">{t("quick_post.schedule.title")}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {t("quick_post.schedule.description")}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { value: "best_time", label: t("quick_post.schedule.options.best_time") },
                { value: "now",       label: t("quick_post.schedule.options.now") },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="qp_default_schedule_mode"
                    value={value}
                    checked={kit.qp_default_schedule_mode === value}
                    onChange={() => setKit((k) => ({ ...k, qp_default_schedule_mode: value }))}
                    className="accent-primary"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>


          {/* Salvează */}
          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? t("common.saving") : saved ? t("quick_post.saved_short") : t("quick_post.save_defaults")}
            </button>
            {saved && <span className="text-sm text-green-600">{t("quick_post.saved_message")}</span>}
          </div>

        </div>
      )}
    </div>
  )
}
