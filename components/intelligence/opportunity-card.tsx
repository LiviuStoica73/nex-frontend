// components/intelligence/opportunity-card.tsx
// Version: 1.0.0 — 2026-07-11
// Scope: Card individual oportunitate cu butoane contextuale per stare
// Stări: idea → generating → review → published → rejected

'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, RefreshCw, Send, Zap, X, RotateCcw } from 'lucide-react'
import { updatePrototype, regenerateOpportunityImage, updateOpportunityStatus } from '@/lib/api/intelligence'
import type { ContentOpportunity } from '@/lib/api/intelligence'

interface OpportunityCardProps {
  opportunity: ContentOpportunity
  rank?: number
  selected: boolean
  onSelect: (id: string, selected: boolean) => void
  onGenerate: (id: string) => void
  onPublish: (id: string) => void
  onReject: (id: string) => void
  onRestore: (id: string) => void
  onReset: (id: string) => void
  orgId: string
  token: string
}

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  idea: { label: 'Idee', variant: 'secondary' },
  generating: { label: 'Se generează...', variant: 'outline' },
  review: { label: 'Verifică', variant: 'default' },
  published: { label: 'Publicat', variant: 'secondary' },
  rejected: { label: 'Respins', variant: 'destructive' },
}

export function OpportunityCard({
  opportunity: opp,
  rank,
  selected,
  onSelect,
  onGenerate,
  onPublish,
  onReject,
  onRestore,
  onReset,
  orgId,
  token,
}: OpportunityCardProps) {
  const [editText, setEditText] = useState(opp.master_text || '')
  const [editPrompt, setEditPrompt] = useState(opp.image_prompt_raw || opp.image_prompt || '')
  const [showPrompt, setShowPrompt] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [localImageUrl, setLocalImageUrl] = useState(opp.image_url)

  // Sync when polling updates opp from generating→review
  useEffect(() => {
    if (opp.master_text) setEditText(opp.master_text)
  }, [opp.master_text])

  useEffect(() => {
    if (opp.image_url) setLocalImageUrl(opp.image_url)
  }, [opp.image_url])

  useEffect(() => {
    const p = opp.image_prompt_raw || opp.image_prompt
    if (p) setEditPrompt(p)
  }, [opp.image_prompt_raw, opp.image_prompt])

  const badge = STATUS_BADGE[opp.status] ?? { label: opp.status, variant: 'secondary' as const }
  const isGenerating = opp.status === 'generating'
  const isReview = opp.status === 'review'
  const isPublished = opp.status === 'published'
  const isRejected = opp.status === 'rejected'
  const isIdea = opp.status === 'idea'

  async function handleSaveText() {
    setSaving(true)
    try {
      await updatePrototype(orgId, opp.id, { master_text: editText }, token)
    } finally {
      setSaving(false)
    }
  }

  async function handleResetToIdea() {
    setResetting(true)
    try {
      await updateOpportunityStatus(orgId, opp.id, 'idea', token)
      onReset(opp.id)
    } finally {
      setResetting(false)
    }
  }

  async function handleRegenerateImage() {
    setRegenerating(true)
    try {
      const result = await regenerateOpportunityImage(orgId, opp.id, token, editPrompt || undefined)
      setLocalImageUrl(result.image_url)
    } finally {
      setRegenerating(false)
    }
  }

  async function handleSavePrompt() {
    setSaving(true)
    try {
      await updatePrototype(orgId, opp.id, { image_prompt_raw: editPrompt }, token)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className={`relative transition-all ${isRejected ? 'opacity-50' : ''} ${selected ? 'ring-2 ring-primary' : ''}`}>
      {/* Checkbox bulk — doar pe idea */}
      {isIdea && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            className="w-4 h-4 cursor-pointer accent-primary"
            checked={selected}
            onChange={(e) => onSelect(opp.id, e.target.checked)}
          />
        </div>
      )}

      <CardContent className={`pt-4 pb-3 space-y-3 ${isIdea ? 'pl-9' : 'pl-4'}`}>
        {/* Header: titlu + badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-snug">
              {rank !== undefined && (
                <span className="text-xs text-muted-foreground font-mono mr-1">#{rank}</span>
              )}
              {opp.title}
            </p>
            {opp.hook && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{opp.hook}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {opp.score !== null && (
              <Badge variant="outline" className="text-xs">{opp.score}</Badge>
            )}
            <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
          </div>
        </div>

        {/* Platforme */}
        {opp.platforms?.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {opp.platforms.map(p => (
              <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
            ))}
          </div>
        )}

        {/* Spinner generating */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>Se generează text și imagine...</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleResetToIdea}
              disabled={resetting}
              className="w-full text-xs h-7 text-muted-foreground"
            >
              {resetting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RotateCcw className="h-3 w-3 mr-1" />}
              Resetează (blocat?)
            </Button>
          </div>
        )}

        {/* Review: imagine + text editabil + prompt vizual + butoane */}
        {isReview && (
          <div className="space-y-3">
            {localImageUrl && (
              <div className="flex items-center gap-2">
                {/* Thumbnail — click deschide lightbox */}
                <img
                  src={localImageUrl}
                  alt="Prototip"
                  className="h-16 w-16 rounded-md object-cover cursor-zoom-in shrink-0 border border-border"
                  onClick={() => setLightboxOpen(true)}
                  title="Click pentru a vedea imaginea completă"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs"
                  onClick={() => {
                    if (!confirm('Regenerarea imaginii consumă credite conform selecțiilor din Quick Post. Continui?')) return
                    handleRegenerateImage()
                  }}
                  disabled={regenerating}
                >
                  {regenerating
                    ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    : <RefreshCw className="h-3 w-3 mr-1" />}
                  Regenerează imagine
                </Button>
              </div>
            )}

            {/* Lightbox simplu */}
            {lightboxOpen && localImageUrl && (
              <div
                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                onClick={() => setLightboxOpen(false)}
              >
                <img
                  src={localImageUrl}
                  alt="Prototip full"
                  className="max-w-full max-h-full rounded-lg object-contain"
                />
              </div>
            )}

            {/* Prompt vizual — toggle + editabil */}
            <div>
              <button
                className="text-xs text-muted-foreground underline-offset-2 hover:underline flex items-center gap-1"
                onClick={() => setShowPrompt(p => !p)}
              >
                {showPrompt ? '▲' : '▼'} Prompt vizual
              </button>
              {showPrompt && (
                <div className="mt-1 space-y-1">
                  <Textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    rows={3}
                    className="text-xs resize-y"
                    placeholder="Descrie scena vizuală..."
                  />
                  <p className="text-xs text-muted-foreground">Editează promptul vizual, apoi apasă <strong>Regenerează imagine</strong> pentru a regenera cu noul prompt. Atenție! Sunt utilizate credite conform selecțiilor din Quick Post.</p>
                </div>
              )}
            </div>

            {/* Text master editabil */}
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={5}
              className="text-sm resize-y"
              placeholder="Text master..."
            />

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveText}
                disabled={saving}
                className="flex-1"
              >
                {saving && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Salvează
              </Button>
              <Button
                size="sm"
                onClick={() => onPublish(opp.id)}
                className="flex-1"
              >
                <Send className="h-3 w-3 mr-1" />
                Publică
              </Button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onReject(opp.id)}
              className="w-full text-destructive hover:text-destructive text-xs h-7"
            >
              <X className="h-3 w-3 mr-1" />
              Respinge
            </Button>
          </div>
        )}

        {/* Idea: buton generare */}
        {isIdea && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onGenerate(opp.id)} className="flex-1">
              <Zap className="h-3 w-3 mr-1" />
              Generează prototip
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onReject(opp.id)}
              className="text-destructive hover:text-destructive px-2"
              title="Respinge"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Published */}
        {isPublished && (
          <p className="text-xs text-muted-foreground">Publicat în Calendar</p>
        )}

        {/* Rejected */}
        {isRejected && (
          <Button size="sm" variant="ghost" onClick={() => onRestore(opp.id)} className="w-full text-xs h-7">
            <RotateCcw className="h-3 w-3 mr-1" />
            Restaurează
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
