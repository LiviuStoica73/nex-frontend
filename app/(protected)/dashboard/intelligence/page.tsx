// app/(protected)/dashboard/intelligence/page.tsx
// Version: 2.0.0 — 2026-07-11
// Scope: Content Intelligence — coordonează state între tab-uri:
//        pollTrigger pentru strategy, pendingOpportunityIds pentru autopilot

'use client'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BusinessBrainTab } from '@/components/intelligence/business-brain-tab'
import { StrategyTab } from '@/components/intelligence/strategy-tab'
import { OpportunitiesTab } from '@/components/intelligence/opportunities-tab'
import { AutopilotTab } from '@/components/intelligence/autopilot-tab'

export default function IntelligencePage() {
  const [pollTrigger, setPollTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState('brain')
  const [pendingOpportunityIds, setPendingOpportunityIds] = useState<string[]>([])

  const handleStrategyStarted = () => {
    setPollTrigger(t => t + 1)
    setTimeout(() => setActiveTab('strategy'), 2000)
  }

  const handleSendToAutopilot = (ids: string[]) => {
    setPendingOpportunityIds(ids)
    setActiveTab('autopilot')
  }

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
          <TabsTrigger value="opportunities" className="relative">
            Oportunități
          </TabsTrigger>
          <TabsTrigger value="autopilot" className="relative">
            Autopilot
            {pendingOpportunityIds.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs w-4 h-4">
                {pendingOpportunityIds.length}
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
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
