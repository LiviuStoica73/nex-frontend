"use client"

import { useEffect, useRef, useState } from "react"
import { Trash2, Upload, Link, RefreshCw, RotateCcw, Download } from "lucide-react"
import { useTranslations } from "next-intl"

interface RagDoc {
  id: string
  filename: string
  file_type: string
  chunk_count: number
  status: "processing" | "indexed" | "failed"
  created_at: string
}

interface Props { orgId: string; token: string }

const STATUS_ICON: Record<RagDoc["status"], string> = {
  processing: "⏳",
  indexed: "✅",
  failed: "❌",
}

export function RagManager({ orgId, token }: Props) {
  const t = useTranslations("rag_manager")
  const [docs, setDocs] = useState<RagDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [urlName, setUrlName] = useState("")
  const [addingUrl, setAddingUrl] = useState(false)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [querying, setQuerying] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"

  const headers = { Authorization: `Bearer ${token}` }

  const fetchDocs = async () => {
    const res = await fetch(`${API}/api/v1/orgs/${orgId}/rag`, { headers })
    if (res.ok) setDocs(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchDocs() }, [])

  const uploadFile = async (file: File) => {
    setUploading(true)
    const form = new FormData()
    form.append("file", file)
    await fetch(`${API}/api/v1/orgs/${orgId}/rag/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    await fetchDocs()
    setUploading(false)
  }

  const addUrl = async () => {
    if (!urlInput.trim()) return
    setAddingUrl(true)
    await fetch(`${API}/api/v1/orgs/${orgId}/rag/url`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ url: urlInput, filename: urlName || undefined }),
    })
    setUrlInput("")
    setUrlName("")
    await fetchDocs()
    setAddingUrl(false)
  }

  const deleteDoc = async (id: string) => {
    await fetch(`${API}/api/v1/orgs/${orgId}/rag/${id}`, { method: "DELETE", headers })
    setDocs((d) => d.filter((doc) => doc.id !== id))
  }

  const downloadDoc = async (id: string, filename: string) => {
    const res = await fetch(`${API}/api/v1/orgs/${orgId}/rag/${id}/download`, { headers })
    if (!res.ok) return
    const { url } = await res.json()
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
  }

  const deleteAllDocs = async () => {
    if (!confirm(t("delete_all_confirm"))) return
    setDeletingAll(true)
    await fetch(`${API}/api/v1/orgs/${orgId}/rag`, { method: "DELETE", headers })
    setDocs([])
    setDeletingAll(false)
  }

  const queryRag = async () => {
    if (!question.trim()) return
    setQuerying(true)
    setAnswer("")
    const res = await fetch(`${API}/api/v1/orgs/${orgId}/rag/query`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    })
    if (res.ok) {
      const data = await res.json()
      setAnswer(data.answer)
    }
    setQuerying(false)
  }

  return (
    <div className="space-y-8">
      {/* Upload section */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h2 className="font-semibold">{t("upload.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("upload.description")}
        </p>

        <div className="flex gap-3 flex-wrap">
          {/* File upload */}
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.xlsx" className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            <Upload className="h-4 w-4" />
            {uploading ? t("upload.uploading") : t("upload.button")}
          </button>
        </div>

        {/* URL ingest */}
        <div className="flex gap-2">
          <input className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            placeholder={t("url.placeholder")} value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)} />
          <input className="w-40 rounded-md border bg-background px-3 py-2 text-sm"
            placeholder={t("url.name_placeholder")} value={urlName}
            onChange={(e) => setUrlName(e.target.value)} />
          <button onClick={addUrl} disabled={addingUrl || !urlInput.trim()}
            className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50">
            <Link className="h-4 w-4" />
            {addingUrl ? t("processing") : t("url.add")}
          </button>
        </div>
      </div>

      {/* Documents list */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">{t("indexed.title", { count: docs.length })}</h2>
          <div className="flex items-center gap-2">
            <button onClick={fetchDocs} className="text-muted-foreground hover:text-foreground" title={t("refresh_list")}>
              <RefreshCw className="h-4 w-4" />
            </button>
            {docs.length > 0 && (
              <button
                onClick={deleteAllDocs}
                disabled={deletingAll}
                title={t("delete_all_title")}
                className="flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                <RotateCcw className="h-3 w-3" />
                {deletingAll ? t("deleting") : t("new_rag")}
              </button>
            )}
          </div>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">{t("loading")}</p>
        ) : docs.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {t("indexed.empty")}
          </p>
        ) : (
          <ul className="divide-y">
            {docs.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{doc.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {STATUS_ICON[doc.status]} {t(`status.${doc.status}`)} · {t("indexed.chunks", { count: doc.chunk_count })} · {doc.file_type.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => downloadDoc(doc.id, doc.filename)} title={t("download")} className="text-muted-foreground hover:text-foreground">
                    <Download className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteDoc(doc.id)} title={t("delete")} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Test RAG */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h2 className="font-semibold">{t("test.title")}</h2>
        <div className="flex gap-2">
          <input className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            placeholder={t("test.placeholder")}
            value={question} onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && queryRag()} />
          <button onClick={queryRag} disabled={querying || !question.trim()}
            className="rounded-md bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 disabled:opacity-50">
            {querying ? "⏳" : t("test.ask")}
          </button>
        </div>
        {answer && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm leading-relaxed">
            {answer}
          </div>
        )}
      </div>
    </div>
  )
}
