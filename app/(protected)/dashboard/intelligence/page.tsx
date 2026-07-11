// app/(protected)/dashboard/intelligence/page.tsx
// Version: 2.1.0 — 2026-07-11
// Scope: Intelligence — state autopilot (themes, stage, approvedIds) mutat în pagină
//        ca să persiste la navigarea între tab-uri

'use client'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BusinessBrainTab } from '@/components/intelligence/business-brain-tab'
import { StrategyTab } from '@/components/intelligence/strategy-tab'
import { OpportunitiesTab } from '@/components/intelligence/opportunities-tab'
import { AutopilotTab } from '@/components/intelligence/autopilot-tab'

export type AutopilotStage = 'idle' | 'etapa1' | 'etapa2' | 'generating' | 'done'

export interface Theme {
  opportunity_id: string
  title: string
  hook: string | null
  pillar: string | null
  platforms: string[]
  format: string | null
  visual_category: string
  score: number | null
}

export default function IntelligencePage() {
  const [pollTrigger, setPollTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState('brain')

  // State autopilot persistat la nivel de pagină (supraviețuiește navigării între tab-uri)
  const [pendingOpportunityIds, setPendingOpportunityIds] = useState<string[]>([])
  const [autopilotThemes, setAutopilotThemes] = useState<Theme[]>([])
  const [autopilotStage, setAutopilotStage] = useState<AutopilotStage>('idle')
  const [autopilotApprovedIds, setAutopilotApprovedIds] = useState<Set<string>>(new Set())

  const handleStrategyStarted = () => {
    setPollTrigger(t => t + 1)
    setTimeout(() => setActiveTab('strategy'), 2000)
  }

  const handleSendToAutopilot = (ids: string[]) => {
    // Adaugă la pending fără să șteargă ce e deja acolo sau în themes
    setPendingOpportunityIds(prev => {
      const existing = new Set(prev)
      ids.forEach(id => existing.add(id))
      return Array.from(existing)
    })
    setActiveTab('autopilot')
  }

  const autopilotPendingCount = autopilotStage === 'idle' ? pendingOpportunityIds.length : 0
  const autopilotBadge = autopilotPendingCount > 0
    ? autopilotPendingCount
    : autopilotThemes.length > 0
    ? autopilotThemes.length
    : 0

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content Intelligence</h1>
        <p className="text-muted-foreground">
          AI Marketing Manager — strategie, oportunități și autopilot pentru brandul tău
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="brain">Business Brain</TabsTrigger>
          <TabsTrigger value="strategy">Strategie</TabsTrigger>
          <TabsTrigger value="opportunities">Oportunități</TabsTrigger>
          <TabsTrigger value="autopilot" className="relative">
            Autopilot
            {autopilotBadge > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs w-4 h-4">
                {autopilotBadge}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brain" className="mt-6">
          <BusinessBrainTab onStrategyStarted={handleStrategyStarted} />
        </TabsContent>
        <TabsContent value="strategy" className="mt-6">
          <StrategyTab pollTrigger={pollTrigger} />
        </TabsContent>
        <TabsContent value="opportunities" className="mt-6">
          <OpportunitiesTab onSendToAutopilot={handleSendToAutopilot} />
        </TabsContent>
        <TabsContent value="autopilot" className="mt-6">
          <AutopilotTab
            pendingOpportunityIds={pendingOpportunityIds}
            onClearPending={() => setPendingOpportunityIds([])}
            themes={autopilotThemes}
            onThemesChange={setAutopilotThemes}
            stage={autopilotStage}
            onStageChange={setAutopilotStage}
            approvedIds={autopilotApprovedIds}
            onApprovedIdsChange={setAutopilotApprovedIds}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
