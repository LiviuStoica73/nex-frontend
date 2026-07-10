// app/(protected)/dashboard/intelligence/page.tsx
// Version: 1.1.0 — 2026-07-11
// Scope: Content Intelligence dashboard — coordonează pollTrigger între BusinessBrain și Strategy tabs

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

  const handleStrategyStarted = () => {
    setPollTrigger(t => t + 1)
    // Trecem automat la tab-ul Strategie după 2 secunde
    setTimeout(() => setActiveTab('strategy'), 2000)
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
          <TabsTrigger value="opportunities">Oportunități</TabsTrigger>
          <TabsTrigger value="autopilot">Autopilot</TabsTrigger>
        </TabsList>

        <TabsContent value="brain" className="mt-6">
          <BusinessBrainTab onStrategyStarted={handleStrategyStarted} />
        </TabsContent>
        <TabsContent value="strategy" className="mt-6">
          <StrategyTab pollTrigger={pollTrigger} />
        </TabsContent>
        <TabsContent value="opportunities" className="mt-6">
          <OpportunitiesTab />
        </TabsContent>
        <TabsContent value="autopilot" className="mt-6">
          <AutopilotTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
