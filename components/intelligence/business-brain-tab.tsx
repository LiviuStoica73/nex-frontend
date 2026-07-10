// components/intelligence/business-brain-tab.tsx
// Version: 1.0.0 — 2026-07-10
// Scope: Business Brain tab — website scan, strategy trigger, RAG/competitor status

'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOrg } from '@/contexts/org-context'
import { getBusinessBrainStatus, scanWebsite, runStrategy } from '@/lib/api/intelligence'

interface BrainStatus {
  interview_questions_answered: number
  website_scan_date: string | null
  website_scan_depth: string | null
  competitors_count: number
  rag_documents_count: number
  can_run_strategy: boolean
}

export function BusinessBrainTab() {
  const { data: session } = useSession()
  const { activeOrgId } = useOrg()
  const [status, setStatus] = useState<BrainStatus | null>(null)
  const [scanUrl, setScanUrl] = useState('')
  const [scanDepth, setScanDepth] = useState<'standard' | 'deep'>('standard')
  const [scanning, setScanning] = useState(false)
  const [runningStrategy, setRunningStrategy] = useState(false)
  const [message, setMessage] = useState('')

  const token = (session?.user as any)?.accessToken || ''
  const orgId = activeOrgId

  useEffect(() => {
    if (!token || !orgId) return
    getBusinessBrainStatus(orgId, token).then(setStatus).catch(console.error)
  }, [token, orgId])

  const handleScan = async () => {
    if (!scanUrl || !token || !orgId) return
    setScanning(true)
    setMessage('')
    try {
      await scanWebsite(orgId, scanUrl, scanDepth, token)
      setMessage(`Scanarea a pornit pentru ${scanUrl}. Durează 1-3 minute.`)
    } catch (e: any) {
      setMessage(`Eroare: ${e.message}`)
    } finally {
      setScanning(false)
    }
  }

  const handleRunStrategy = async () => {
    if (!token || !orgId) return
    setRunningStrategy(true)
    setMessage('')
    try {
      const result = await runStrategy(orgId, scanDepth, token)
      setMessage(`Strategia a pornit! Cost: ${result.credits_consumed} credite. Durează ~1 minut.`)
    } catch (e: any) {
      setMessage(`Eroare: ${e.message}`)
    } finally {
      setRunningStrategy(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Status surse */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Interviu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.interview_questions_answered || 0}/10</div>
            <Badge variant={status?.interview_questions_answered ? 'default' : 'secondary'}>
              {status?.interview_questions_answered ? 'Parțial completat' : 'Lipsă'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Website Scan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {status?.website_scan_date
                ? new Date(status.website_scan_date).toLocaleDateString('ro')
                : 'Nescanat'}
            </div>
            <Badge variant={status?.website_scan_date ? 'default' : 'secondary'}>
              {status?.website_scan_depth || 'lipsă'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Competitori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.competitors_count || 0}</div>
            <p className="text-xs text-muted-foreground">adăugați</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Documente RAG</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.rag_documents_count || 0}</div>
            <p className="text-xs text-muted-foreground">fișiere indexate</p>
          </CardContent>
        </Card>
      </div>

      {/* Scan website */}
      <Card>
        <CardHeader>
          <CardTitle>Scanează site-ul</CardTitle>
          <CardDescription>
            Standard (20cr): 15 pagini principale. Avansat (30cr): site complet, blog, FAQ.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com"
              value={scanUrl}
              onChange={(e) => setScanUrl(e.target.value)}
              className="flex-1"
            />
            <Select value={scanDepth} onValueChange={(v) => setScanDepth(v as 'standard' | 'deep')}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (20cr)</SelectItem>
                <SelectItem value="deep">Avansat (30cr)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleScan} disabled={scanning || !scanUrl}>
              {scanning ? 'Se scanează...' : 'Scanează'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generează strategie */}
      <Card>
        <CardHeader>
          <CardTitle>Generează Strategie</CardTitle>
          <CardDescription>
            Business Analysis + Content Strategy + 100 oportunități prioritizate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleRunStrategy}
            disabled={runningStrategy || !status?.can_run_strategy}
            size="lg"
            className="w-full"
          >
            {runningStrategy
              ? 'Se generează...'
              : `Generează Strategie — ${scanDepth === 'deep' ? '30' : '20'} credite`}
          </Button>
          {!status?.can_run_strategy && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Completează minim un interviu sau scanează site-ul pentru a activa.
            </p>
          )}
        </CardContent>
      </Card>

      {message && (
        <div className="p-3 bg-muted rounded-md text-sm">{message}</div>
      )}
    </div>
  )
}
