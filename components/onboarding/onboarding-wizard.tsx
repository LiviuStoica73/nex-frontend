"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Building2, Share2, BookOpen, Bot, Check } from "lucide-react"
import { useRouter } from "next/navigation"

interface Props { token: string; existingOrgId?: string }

const STEPS = [
  { id: 1, icon: Building2, titleKey: "steps.brand.title" },
  { id: 2, icon: Share2, titleKey: "steps.social_accounts.title" },
  { id: 3, icon: BookOpen, titleKey: "steps.brand_intelligence.title" },
  { id: 4, icon: Bot, titleKey: "steps.telegram.title" },
]

const PLATFORMS = ["facebook", "instagram", "linkedin", "x", "discord", "blog"]

export function OnboardingWizard({ token, existingOrgId }: Props) {
  const t = useTranslations("onboarding_wizard")
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [orgName, setOrgName] = useState("")
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [brandVoice, setBrandVoice] = useState("")
  const [creating, setCreating] = useState(false)
  const [orgId, setOrgId] = useState(existingOrgId ?? "")
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

  const togglePlatform = (p: string) =>
    setSelectedPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])

  const createOrg = async () => {
    if (!orgName.trim()) return
    setCreating(true)
    if (existingOrgId) {
      // Redenumim org-ul auto-creat la sync
      const res = await fetch(`${API}/api/v1/orgs/${existingOrgId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ name: orgName }),
      })
      if (res.ok) setStep(2)
    } else {
      const res = await fetch(`${API}/api/v1/orgs`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: orgName }),
      })
      if (res.ok) {
        const org = await res.json()
        setOrgId(org.id)
        setStep(2)
      }
    }
    setCreating(false)
  }

  const saveBrandVoice = async () => {
    if (orgId && brandVoice.trim()) {
      await fetch(`${API}/api/v1/orgs/${orgId}/brand-kit`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ brand_voice: brandVoice }),
      })
    }
    setStep(4)
  }

  const finish = () => router.push("/dashboard")

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((s) => (
              <div key={s.id} className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                s.id < step ? "text-green-600" : s.id === step ? "text-primary" : "text-muted-foreground"
              }`}>
                {s.id < step ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                <span className="hidden sm:inline">{t(s.titleKey)}</span>
              </div>
            ))}
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div className="h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-sm p-8 space-y-6">
          {/* Step 1 — Org name */}
          {step === 1 && (
            <>
              <div>
                <h1 className="text-2xl font-bold">{t("welcome_title")}</h1>
                <p className="text-muted-foreground mt-1">{t("welcome_subtitle")}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("brand_name")}</label>
                <input className="w-full rounded-md border bg-background px-3 py-2"
                  placeholder={t("brand_name_placeholder")}
                  value={orgName} onChange={(e) => setOrgName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createOrg()} />
              </div>
              <button onClick={createOrg} disabled={creating || !orgName.trim()}
                className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:bg-primary/90">
                {creating ? t("creating") : t("continue")}
              </button>
            </>
          )}

          {/* Step 2 — Platforms */}
          {step === 2 && (
            <>
              <div>
                <h1 className="text-2xl font-bold">{t("platforms_title")}</h1>
                <p className="text-muted-foreground mt-1">{t("platforms_subtitle")}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {PLATFORMS.map((p) => (
                  <button key={p} onClick={() => togglePlatform(p)}
                    className={`rounded-lg border p-3 text-sm font-medium transition-colors capitalize ${
                      selectedPlatforms.includes(p)
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}>
                    {p === "x" ? "X / Twitter" : p === "blog" ? "Blog WP" : p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(3)}
                className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                {t("continue")}
              </button>
            </>
          )}

          {/* Step 3 — Brand voice */}
          {step === 3 && (
            <>
              <div>
                <h1 className="text-2xl font-bold">{t("brand_voice_title")}</h1>
                <p className="text-muted-foreground mt-1">
                  {t("brand_voice_subtitle")}
                </p>
              </div>
              <textarea className="w-full rounded-md border bg-background px-3 py-2 min-h-[120px] resize-none text-sm"
                placeholder={t("brand_voice_placeholder")}
                value={brandVoice} onChange={(e) => setBrandVoice(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={saveBrandVoice}
                  className="flex-1 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  {t("continue")}
                </button>
                <button onClick={() => setStep(4)}
                  className="rounded-md border px-4 py-2.5 text-sm hover:bg-muted">
                  {t("skip")}
                </button>
              </div>
            </>
          )}

          {/* Step 4 — Telegram */}
          {step === 4 && (
            <>
              <div>
                <h1 className="text-2xl font-bold">{t("telegram_title")}</h1>
                <p className="text-muted-foreground mt-1">
                  {t("telegram_subtitle")}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 border p-4 text-sm space-y-2">
                <p className="font-medium">{t("telegram_how_to")}</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>{t("telegram_steps.open_settings")}</li>
                  <li>{t("telegram_steps.generate_code")}</li>
                  <li>{t.rich("telegram_steps.send_code", { bot: () => <span className="font-mono font-medium">@NexNexBot</span> })}</li>
                </ol>
              </div>
              <button onClick={finish}
                className="w-full rounded-md bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700">
                {t("finish")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
