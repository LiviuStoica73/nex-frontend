// components/intelligence/business-brain-tab.tsx
// Version: 1.2.0 — 2026-08-02
// Scope: Business Brain tab — interview cu tag input pentru competitori, website scan, strategy trigger, status polling

'use client'
import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOrg } from '@/contexts/org-context'
import { getBusinessBrainStatus, scanWebsite, saveInterview, deleteWebsiteScan } from '@/lib/api/intelligence'

interface WebsiteScanRecord {
  id: string
  url: string
  depth: string
  scanned_at: string
  pages_count: number | null
  failed: boolean
}

interface BrainStatus {
  interview_questions_answered: number
  interview_answers: Record<string, string>
  website_scan_date: string | null
  website_scan_depth: string | null
  website_scans: WebsiteScanRecord[]
  competitors_count: number
  rag_documents_count: number
  can_run_strategy: boolean
}

const INTERVIEW_QUESTIONS: { key: string; labelKey: string }[] = [
  { key: 'what_sells', labelKey: 'interview_questions.what_sells' },
  { key: 'target_audience', labelKey: 'interview_questions.target_audience' },
  { key: 'problems_solved', labelKey: 'interview_questions.problems_solved' },
  { key: 'priority_products', labelKey: 'interview_questions.priority_products' },
  { key: 'differentiator', labelKey: 'interview_questions.differentiator' },
  { key: 'communication_tone', labelKey: 'interview_questions.communication_tone' },
  { key: 'what_to_avoid', labelKey: 'interview_questions.what_to_avoid' },
  { key: 'objectives', labelKey: 'interview_questions.objectives' },
  { key: 'website_url', labelKey: 'interview_questions.website_url' },
  { key: 'known_competitors', labelKey: 'interview_questions.known_competitors' },
]

function parseCompetitors(value: string): string[] {
  if (!value.trim()) return []
  return value.split(',').map(s => s.trim()).filter(Boolean)
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.includes('.')) return 'https://' + trimmed
  return trimmed
}

function CompetitorTagInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [inputVal, setInputVal] = useState('')
  const tags = parseCompetitors(value)

  const addTag = () => {
    const normalized = normalizeUrl(inputVal)
    if (!normalized || tags.includes(normalized)) { setInputVal(''); return }
    onChange([...tags, normalized].join(', '))
    setInputVal('')
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag).join(', '))
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
    if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {tags.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium max-w-[260px]">
          <span className="truncate">{tag}</span>
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-primary/60 hover:text-primary ml-0.5 flex-shrink-0"
            aria-label="Șterge"
          >×</button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[160px] bg-transparent outline-none placeholder:text-muted-foreground text-sm"
        placeholder={tags.length === 0 ? 'buffer.com, hootsuite.com … Enter pentru a adăuga' : 'Adaugă competitor…'}
        value={inputVal}
        onChange={e => setInputVal(e.target.value)}
        onKeyDown={handleKey}
        onBlur={addTag}
      />
    </div>
  )
}

export function BusinessBrainTab() {
  const t = useTranslations('business_brain')
  const { data: session } = useSession()
  const { activeOrgId } = useOrg()
  const [status, setStatus] = useState<BrainStatus | null>(null)
  const [scanUrl, setScanUrl] = useState('')
  const [scanDepth, setScanDepth] = useState<'standard' | 'deep'>('standard')
  const [scanning, setScanning] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info')
  const [showInterview, setShowInterview] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [savingInterview, setSavingInterview] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)
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
            setMessage(t('scan_completed'))
            setMessageType('success')
          } else {
            setMessage(t('scan_taking_longer'))
            setMessageType('info')
          }
        }
      }).catch(console.error)
    }, 15000)
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const handleDeleteScan = async (scanId: string, url: string) => {
    if (!window.confirm(`Delete scan for "${url}"?`)) return
    setDeletingId(scanId)
    try {
      await deleteWebsiteScan(orgId!, scanId, token)
      setRefreshCount(c => c + 1)
    } catch (e: any) {
      setMessage(t('error_with_message', { message: e.message }))
      setMessageType('error')
    } finally {
      setDeletingId(null)
    }
  }

  const doScan = async (url: string) => {
    setScanning(true)
    setMessage('')
    const prevDate = status?.website_scan_date || null
    try {
      await scanWebsite(orgId!, url, scanDepth, token)
      setMessage(t('scan_started', { url }))
      setMessageType('info')
      startScanPolling(prevDate)
    } catch (e: any) {
      setMessage(t('error_with_message', { message: e.message }))
      setMessageType('error')
    } finally {
      setScanning(false)
    }
  }

  const handleScan = async () => {
    const normalizedScanUrl = normalizeUrl(scanUrl)
    if (normalizedScanUrl !== scanUrl) setScanUrl(normalizedScanUrl)
    if (!normalizedScanUrl || !token || !orgId) return

    const alreadyScanned = status?.website_scans?.some(
      s => s.url.replace(/\/$/, '').toLowerCase() === normalizedScanUrl.replace(/\/$/, '').toLowerCase()
    )
    if (alreadyScanned) {
      if (!window.confirm(`"${normalizedScanUrl}" has already been scanned. Re-scan and replace the existing data?`)) return
    }
    await doScan(normalizedScanUrl)
  }

  const handleSaveInterview = async () => {
    if (!token || !orgId) return
    setSavingInterview(true)
    try {
      // Merge: răspunsurile existente + cele din form (form are prioritate)
      const merged = { ...(status?.interview_answers || {}), ...answers }
      await saveInterview(orgId, merged, token)
      setMessage(t('interview_saved'))
      setMessageType('success')
      setShowInterview(false)
      setRefreshCount(c => c + 1)
    } catch (e: any) {
      setMessage(t('error_with_message', { message: e.message }))
      setMessageType('error')
    } finally {
      setSavingInterview(false)
    }
  }

  const answeredCount = Object.values(answers).filter(v => v?.trim()).length

  return (
    <div className="space-y-4">
      {/* Status surse */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
          onClick={() => {
            if (!showInterview && status?.interview_answers) {
              setAnswers(status.interview_answers)
            }
            setShowInterview(!showInterview)
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Interviu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.interview_questions_answered || 0}/10</div>
            <Badge variant={status?.interview_questions_answered ? 'default' : 'secondary'}>
              {status?.interview_questions_answered ? t('partially_completed') : t('missing_click_to_complete')}
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
                : t('not_scanned')}
            </div>
            <Badge variant={status?.website_scan_date ? 'default' : 'secondary'}>
              {status?.website_scan_depth || t('missing')}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Competitori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.competitors_count || 0}</div>
            <p className="text-xs text-muted-foreground">{t('added')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Documente RAG</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status?.rag_documents_count || 0}</div>
            <p className="text-xs text-muted-foreground">{t('indexed_files')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Interviu expandabil */}
      {showInterview && (
        <Card>
          <CardHeader>
            <CardTitle>{t('brand_interview_title', { answered: answeredCount })}</CardTitle>
            <CardDescription>
              {t('brand_interview_description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {INTERVIEW_QUESTIONS.map(({ key, labelKey }, i) => (
              <div key={key} className="space-y-1">
                <label className="text-sm font-medium">{i + 1}. {t(labelKey)}</label>
                {key === 'known_competitors'
                  ? <CompetitorTagInput
                      value={answers[key] || ''}
                      onChange={(val) => setAnswers(prev => ({ ...prev, [key]: val }))}
                    />
                  : <Input
                      placeholder={t('answer_placeholder')}
                      value={answers[key] || ''}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                    />
                }
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveInterview} disabled={savingInterview || answeredCount === 0}>
                {savingInterview ? t('saving') : t('save_interview')}
              </Button>
              <Button variant="outline" onClick={() => setShowInterview(false)}>{t('close')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan website */}
      <Card>
        <CardHeader>
          <CardTitle>{t('scan_website_title')}</CardTitle>
          <CardDescription>
            {t('scan_website_description')}
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
                <SelectItem value="deep">{t('deep_scan')}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleScan} disabled={scanning || !scanUrl}>
              {scanning ? t('starting') : t('scan')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scan history */}
      {(status?.website_scans?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scan history</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left px-4 py-2 font-medium">URL</th>
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-left px-4 py-2 font-medium">Pages</th>
                    <th className="text-left px-4 py-2 font-medium">Date</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {status!.website_scans.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2 max-w-[260px] truncate">
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">{s.url}</a>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.depth === 'deep' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
                          {s.depth === 'deep' ? 'Advanced' : 'Standard'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{s.pages_count ?? '—'}</td>
                      <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{new Date(s.scanned_at).toLocaleString('ro')}</td>
                      <td className="px-4 py-2">
                        {s.failed
                          ? <span className="text-xs text-red-600">Failed</span>
                          : <span className="text-xs text-green-600">OK</span>}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => handleDeleteScan(s.id, s.url)}
                          disabled={deletingId === s.id}
                          className="text-muted-foreground hover:text-red-500 transition-colors text-xs px-1"
                          title="Delete scan"
                        >
                          {deletingId === s.id ? '…' : '×'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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
