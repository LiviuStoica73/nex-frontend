// app/(protected)/dashboard/intelligence/page.tsx
// Version: 3.2.0 — 2026-07-19
// Scope: Intelligence — Business Brain, Strategie, Oportunități, Vizualizare (fost Autopilot)

'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useOrg } from '@/contexts/org-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BusinessBrainTab } from '@/components/intelligence/business-brain-tab'
import { StrategyTab } from '@/components/intelligence/strategy-tab'
import { OpportunitiesTab } from '@/components/intelligence/opportunities-tab'
import type { SelectedOpportunity } from '@/components/intelligence/opportunities-tab'
import { AutopilotTab } from '@/components/intelligence/autopilot-tab'

// Acceptăm și vechiul slug 'autopilot' pentru compatibilitate cu URL-uri salvate
const VALID_TABS = ['brain', 'strategy', 'opportunities', 'vizualizare', 'autopilot']
const normalizeTab = (t: string) => t === 'autopilot' ? 'vizualizare' : t

export default function IntelligencePage() {
  const { activeOrgId } = useOrg()
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pollTrigger, setPollTrigger] = useState(0)

  const tabFromUrl = searchParams.get('tab')
  const resolvedTab = tabFromUrl && VALID_TABS.includes(tabFromUrl) ? normalizeTab(tabFromUrl) : 'brain'
  const [activeTab, setActiveTab] = useState(resolvedTab)

  // Sincronizează tab-ul activ când URL-ul se schimbă din exterior (ex: click meniu sidebar)
  useEffect(() => {
    setActiveTab(resolvedTab)
  }, [resolvedTab])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const token = (session?.user as any)?.accessToken || ''
  const orgId = activeOrgId || ''

  const selectedIds = new Set<string>()
  const handleToggleSelect = (_opp: SelectedOpportunity) => {}

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content Intelligence</h1>
        <p className="text-muted-foreground">
          AI Marketing Manager — strategie și oportunități pentru brandul tău
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="brain">Business Brain</TabsTrigger>
          <TabsTrigger value="strategy">Strategie</TabsTrigger>
          <TabsTrigger value="opportunities">Oportunități</TabsTrigger>
          <TabsTrigger value="vizualizare">Vizualizare</TabsTrigger>
        </TabsList>

        <TabsContent value="brain" className="mt-6">
          <BusinessBrainTab />
        </TabsContent>
        <TabsContent value="strategy" className="mt-6">
          <StrategyTab pollTrigger={pollTrigger} />
        </TabsContent>
        <TabsContent value="opportunities" className="mt-6">
          <OpportunitiesTab
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onGoToAutopilot={() => handleTabChange('vizualizare')}
          />
        </TabsContent>
        <TabsContent value="vizualizare" className="mt-6">
          <AutopilotTab orgId={orgId} token={token} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
