"use client"

import { useState } from "react"
import { Building2, Loader2 } from "lucide-react"
import { useOrg } from "@/contexts/org-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateBrandModal({ open, onClose }: Props) {
  const { createBrand } = useOrg()
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    setError("")
    const result = await createBrand(name.trim())
    if (result.limitReached) {
      setError("Ai atins limita de branduri pe planul actual. Upgrade pentru mai multe.")
      setLoading(false)
      return
    }
    if (!result.ok) {
      setError("Eroare la creare. Încearcă din nou.")
      setLoading(false)
      return
    }
    // createBrand face reload automat
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Brand nou
          </DialogTitle>
          <DialogDescription>
            Introdu numele brandului sau companiei. Vei putea configura logo, culori și vocea brandului în Brand Kit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="brand-name">Numele brandului</Label>
            <Input
              id="brand-name"
              placeholder="ex: TerraSoft, AllMeters.com"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Anulează
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Creează brand
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
