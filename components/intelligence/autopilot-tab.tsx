// components/intelligence/autopilot-tab.tsx
// Version: 1.0.0 — 2026-07-10
// Scope: Autopilot tab — Etapa 1 (free theme proposals) → Etapa 2 (credit-based content generation)

'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useOrg } from '@/contexts/org-context'
import { getAutopilotCost, generateThemesContent } from '@/lib/api/intelligence'

export function AutopilotTab() {
  const { data: session } = useSession()
  const { activeOrgId } = useOrg()
  const [proposedThemes, setProposedThemes] = useState<any[]>([])
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set())
  const [costInfo, setCostInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState<'idle' | 'etapa1' | 'etapa2' | 'generating'>('idle')
  const [message, setMessage] = useState('')

  const token = (session?.user as any)?.accessToken || ''
  const orgId = activeOrgId

  const toggleApprove = (id: string) => {
    setApprovedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleCalculateCost = async () => {
    if (!token || !orgId || approvedIds.size === 0) return
    setLoading(true)
    try {
      const cost = await getAutopilotCost(orgId, approvedIds.size, true, token)
      setCostInfo(cost)
      setStage('etapa2')
    } catch (e: any) {
      setMessage(`Eroare: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmGenerate = async () => {
    if (!token || !orgId) return
    setLoading(true)
    setStage('generating')
    try {
      const approved = proposedThemes.filter((t) => approvedIds.has(t.opportunity_id))
      await generateThemesContent(orgId, 'new-campaign-id', approved, token)
      setMessage(
        `Conținutul se generează pentru ${approved.length} teme. Vei fi notificat când e gata.`
      )
    } catch (e: any) {
      setMessage(`Eroare: ${e.message}`)
      setStage('etapa2')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Autopilot</CardTitle>
          <CardDescription>
            Etapa 1 (gratuit): propune teme din oportunități. Etapa 2 (credite): generează text +
            imagini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stage === 'idle' && (
            <p className="text-sm text-muted-foreground">
              Selectează oportunități din tab-ul Oportunități și revino aici pentru a porni
              Autopilotul.
              <br />
              (Integrarea completă cu selectare oportunități vine în sprint următor.)
            </p>
          )}
        </CardContent>
      </Card>

      {proposedThemes.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Teme propuse — Etapa 1 (0 credite)</h3>
          {proposedThemes.map((theme) => (
            <Card
              key={theme.opportunity_id}
              className={approvedIds.has(theme.opportunity_id) ? 'border-green-500' : ''}
            >
              <CardContent className="py-3 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-medium text-sm">{theme.title}</div>
                  {theme.hook && (
                    <div className="text-xs text-muted-foreground">{theme.hook}</div>
                  )}
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      {theme.visual_category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Scor: {theme.score}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={approvedIds.has(theme.opportunity_id) ? 'default' : 'outline'}
                  onClick={() => toggleApprove(theme.opportunity_id)}
                >
                  {approvedIds.has(theme.opportunity_id) ? '✅ Aprobat' : 'Aprobă'}
                </Button>
              </CardContent>
            </Card>
          ))}

          {stage === 'etapa1' && approvedIds.size > 0 && (
            <Button onClick={handleCalculateCost} disabled={loading}>
              Calculează cost pentru {approvedIds.size} teme aprobate →
            </Button>
          )}

          {stage === 'etapa2' && costInfo && (
            <Card className="border-amber-500">
              <CardContent className="py-4 space-y-3">
                <div className="font-semibold">Confirmare Etapa 2</div>
                <div className="text-sm space-y-1">
                  <div>Teme aprobate: {approvedIds.size}</div>
                  <div>Cost text: {costInfo.text_credits} credite</div>
                  <div>Cost imagini: {costInfo.image_credits} credite</div>
                  <div className="font-bold">Total: {costInfo.total_credits} credite</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Creditele se consumă la generare, indiferent de decizia finală de publicare.
                </p>
                <Button onClick={handleConfirmGenerate} disabled={loading}>
                  Confirmă — consumă {costInfo.total_credits} credite
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {message && <div className="p-3 bg-muted rounded-md text-sm">{message}</div>}
    </div>
  )
}
