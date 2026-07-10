// components/intelligence/business-brain-tab.tsx
// Version: 1.1.0 — 2026-07-11
// Scope: Business Brain tab — interview, website scan, strategy trigger, status polling

'use client'
import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOrg } from '@/contexts/org-context'
import { getBusinessBrainStatus, scanWebsite, runStrategy, saveInterview } from '@/lib/api/intelligence'

interface BrainStatus {
  interview_questions_answered: number
  website_scan_date: string | null
  website_scan_depth: string | null
  competitors_count: number
  rag_documents_count: number
  can_run_strategy: boolean
}

const INTERVIEW_QUESTIONS = [
  'Care este principalul produs sau serviciu oferit?',
  'Cine este clientul ideal (vârstă, profesie, interese)?',
  'Care este propunerea unică de valoare față de concurență?',
  'Care sunt cele mai frecvente obiecții ale clienților?',
  'Ce rezultate concrete obțin clienții după ce lucrează cu tine?',
  'Care sunt canalele de social media folosite actualmente?',
  'Ce tipuri de conținut au funcționat cel mai bine până acum?',
  'Care este tonul brandului (formal, prietenos, autoritar, etc.)?',
  'Există campanii sezoniere sau evenimente importante în calendar?',
  'Care este bugetul lunar aproximativ pentru marketing digital?',
]

export function BusinessBrainTab({ onStrategyStarted }: { onStrategyStarted?: () => void }) {
  const { data: session } = useSession()
  const { activeOrgId } = useOrg()
  const [status, setStatus] = useState<BrainStatus | null>(null)
  const [scanUrl, setScanUrl] = useState('')
  const [scanDepth, setScanDepth] = useState<'standard' | 'deep'>('standard')
  const [scanning, setScanning] = useState(false)
  const [runningStrategy, setRunningStrategy] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info')
  const [showInterview, setShowInterview] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [savingInterview, setSavingInterview] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const token = (session?.user as any)?.accessToken || ''
  const orgId = activeOrgId

  const fetchStatus = () => {
    if (!token || !orgId) return
    getBusinessBrainStatus(orgId, token).then(setStatus).catch(console.error)
  }

  useEffect(() => {
    fetchStatus()
  }, [token, orgId, refreshCount])

  // Polling după scan: verifică la fiecare 15s timp de 3 minute dacă scan_date s-a actualizat
  const startScanPolling = (prevDate: string | null) => {
    let attempts = 0
    pollRef.current = setInterval(() => {
      attempts++
      getBusinessBrainStatus(orgId!, token).then((s) => {
        setStatus(s)
        if (s.website_scan_date !== prevDate || attempts >= 12) {
          clearInterval(pollRef.current!)
          if (s.website_scan_date !== prevDate) {
            setMessage('✓ Scanarea s-a finalizat!')
            setMessageType('success')
          } else {
            setMessage('Scanarea durează mai mult decât de obicei. Verifică din nou mai târziu.')
            setMessageType('info')
          }
        }
      }).catch(console.error)
    }, 15000)
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const handleScan = async () => {
    if (!scanUrl || !token || !orgId) return
    setScanning(true)
    setMessage('')
    const prevDate = status?.website_scan_date || null
    try {
      await scanWebsite(orgId, scanUrl, scanDepth, token)
      setMessage(`⏳ Scanarea a pornit pentru ${scanUrl}. Verificăm automat când se termină (1-3 min)...`)
      setMessageType('info')
      startScanPolling(prevDate)
    } catch (e: any) {
      setMessage(`Eroare: ${e.message}`)
      setMessageType('error')
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
      setMessage(`⏳ Strategia a pornit! Cost: ${result.credits_consumed} credite. Verifică tab-ul Strategie în ~1-2 minute.`)
      setMessageType('info')
      onStrategyStarted?.()
    } catch (e: any) {
      setMessage(`Eroare: ${e.message}`)
      setMessageType('error')
    } finally {
      setRunningStrategy(false)
    }
  }

  const handleSaveInterview = async () => {
    if (!token || !orgId) return
    setSavingInterview(true)
    try {
      await saveInterview(orgId, answers, token)
      setMessage('✓ Interviul a fost salvat!')
      setMessageType('success')
      setShowInterview(false)
      setRefreshCount(c => c + 1)
    } catch (e: any) {
      setMessage(`Eroare: ${e.message}`)
      setMessageType('error')
    } finally {
      setSavingInterview(false)
    }
  }

  const answeredCount = Object.values(answers).filter(v => v.trim()).length

  return (
    <div className="space-y-4">
      {/* Status surse */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
          onClick={() => setShowInterview(!showInterview)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Interviu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.interview_questions_answered || 0}/10</div>
            <Badge variant={status?.interview_questions_answered ? 'default' : 'secondary'}>
              {status?.interview_questions_answered ? 'Parțial completat' : 'Lipsă — click să completezi'}
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

      {/* Interviu expandabil */}
      {showInterview && (
        <Card>
          <CardHeader>
            <CardTitle>Interviu Brand ({answeredCount}/10 completate)</CardTitle>
            <CardDescription>
              Răspunsurile ajută AI-ul să înțeleagă brandul tău înainte de a genera strategia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {INTERVIEW_QUESTIONS.map((q, i) => (
              <div key={i} className="space-y-1">
                <label className="text-sm font-medium">{i + 1}. {q}</label>
                <Input
                  placeholder="Răspunsul tău..."
                  value={answers[`q${i}`] || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [`q${i}`]: e.target.value }))}
                />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveInterview} disabled={savingInterview || answeredCount === 0}>
                {savingInterview ? 'Se salvează...' : 'Salvează interviul'}
              </Button>
              <Button variant="outline" onClick={() => setShowInterview(false)}>Închide</Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (20cr)</SelectItem>
                <SelectItem value="deep">Avansat (30cr)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleScan} disabled={scanning || !scanUrl}>
              {scanning ? 'Se pornește...' : 'Scanează'}
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
              ? 'Se lansează...'
              : `Generează Strategie — ${scanDepth === 'deep' ? '30' : '20'} credite`}
          </Button>
          {!status?.can_run_strategy && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Completează interviul (click pe cardul Interviu) sau scanează site-ul pentru a activa.
            </p>
          )}
        </CardContent>
      </Card>

      {message && (
        <div className={`p-3 rounded-md text-sm ${
          messageType === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200' :
          messageType === 'error' ? 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200' :
          'bg-muted'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}
