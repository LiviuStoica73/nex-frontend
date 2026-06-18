"use client"

import { Check, ChevronsUpDown, Building2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useOrg } from "@/contexts/org-context"
import { useState } from "react"
import { CreateBrandModal } from "@/components/dashboard/create-brand-modal"

export function OrgSwitcher() {
  const { orgs, activeOrgId, activeOrg, switching, switchOrg } = useOrg()
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  if (orgs.length === 0) {
    return (
      <>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted text-sm text-muted-foreground"
        >
          <Plus className="h-4 w-4" />
          Creează brand
        </button>
        <CreateBrandModal open={showCreate} onClose={() => setShowCreate(false)} />
      </>
    )
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-8 px-2 gap-2 max-w-[200px]">
            <Building2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium">
              {activeOrg?.name ?? "—"}
            </span>
            {activeOrg?.is_agency && (
              <span className="text-[10px] bg-primary/10 text-primary px-1 rounded flex-shrink-0">AG</span>
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-1">
          <div className="space-y-0.5">
            {orgs.map((org) => (
              <button
                key={org.id}
                onClick={() => { switchOrg(org.id); setOpen(false) }}
                disabled={switching}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left hover:bg-muted transition-colors",
                  org.id === activeOrgId && "bg-muted font-medium"
                )}
              >
                <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                <span className="truncate flex-1">{org.name}</span>
                {org.is_agency && (
                  <span className="text-[10px] bg-primary/10 text-primary px-1 rounded flex-shrink-0">AG</span>
                )}
                {org.id === activeOrgId && (
                  <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                )}
              </button>
            ))}

            <div className="border-t mt-1 pt-1">
              <button
                onClick={() => { setOpen(false); setShowCreate(true) }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left hover:bg-muted transition-colors text-muted-foreground"
              >
                <Plus className="h-3.5 w-3.5 flex-shrink-0" />
                Brand nou
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <CreateBrandModal open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  )
}
