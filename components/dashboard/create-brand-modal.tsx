"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("create_brand_modal")
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
      setError(t("errors.limit_reached"))
      setLoading(false)
      return
    }
    if (!result.ok) {
      setError(t("errors.create_failed"))
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
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="brand-name">{t("brand_name")}</Label>
            <Input
              id="brand-name"
              placeholder={t("brand_name_placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              {t("cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("create_brand")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
