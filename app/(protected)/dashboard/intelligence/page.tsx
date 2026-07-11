// app/(protected)/dashboard/intelligence/page.tsx
// Version: 2.2.0 — 2026-07-11
// Scope: Intelligence — state autopilot (selectedOpportunities, themes, stage, approvedIds)
//        mutat în pagină-părinte + persistat în localStorage pe orgId

'use client'
import { useEffect, useState } from 'react'
import { useOrg } from '@/contexts/org-context'
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

export interface SelectedOpportunity {
  id: string
  title: string
  hook: string | null
}

function useLocalStorageSet<T extends { id: string }>(key: string): [T[], (items: T[]) => void] {
  const [items, setItemsState] = useState<T[]>([])

  useEffect(() => {
    if (!key) return
    try {
      const raw = localStorage.getItem(key)
      if (raw) setItemsState(JSON.parse(raw))
    } catch {}
  }, [key])

  const setItems = (next: T[]) => {
    setItemsState(next)
    try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
  }

  return [items, setItems]
}

export default function IntelligencePage() {
  const { activeOrgId } = useOrg()
  const [pollTrigger, setPollTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState('brain')

  const storageKey = activeOrgId ? `nex-autopilot-selected-${activeOrgId}` : ''
  const [selectedOpportunities, setSelectedOpportunities] = useLocalStorageSet<SelectedOpportunity>(storageKey)

  // Themes/stage/approvedIds — in-memory (se pierd la refresh, dar e ok — sunt rezultate temporare)
  const [autopilotThemes, setAutopilotThemes] = useState<Theme[]>([])
  const [autopilotStage, setAutopilotStage] = useState<AutopilotStage>('idle')
  const [autopilotApprovedIds, setAutopilotApprovedIds] = useState<Set<string>>(new Set())

  const selectedIds = new Set(selectedOpportunities.map(o => o.id))

  const handleToggleSelect = (opp: SelectedOpportunity) => {
    if (selectedIds.has(opp.id)) {
      setSelectedOpportunities(selectedOpportunities.filter(o => o.id !== opp.id))
    } else {
      setSelectedOpportunities([...selectedOpportunities, opp])
    }
  }

  const handleClearSelected = () => setSelectedOpportunities([])

  const handleStrategyStarted = () => {
    setPollTrigger(t => t + 1)
    setTimeout(() => setActiveTab('strategy'), 2000)
  }

  const autopilotBadge = autopilotStage === 'idle'
    ? selectedOpportunities.length
    : autopilotThemes.length

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
          <OpportunitiesTab
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onGoToAutopilot={() => setActiveTab('autopilot')}
          />
        </TabsContent>
        <TabsContent value="autopilot" className="mt-6">
          <AutopilotTab
            selectedOpportunities={selectedOpportunities}
            onClearSelected={handleClearSelected}
            onRemoveSelected={(id) => setSelectedOpportunities(selectedOpportunities.filter(o => o.id !== id))}
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
