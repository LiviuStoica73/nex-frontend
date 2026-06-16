"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Check, ChevronsUpDown, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { api, type Org } from "@/lib/api"

const ORG_KEY = "nex_active_org_id"

export function OrgSwitcher() {
  const { data: session } = useSession()
  const [orgs, setOrgs] = useState<Org[]>([])
  const [activeOrgId, setActiveOrgId] = useState<string>("")
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)

  const token = session?.user?.accessToken ?? ""

  useEffect(() => {
    if (!token) return
    api.orgs.listMine(token).then((data) => {
      setOrgs(data)
      const stored = localStorage.getItem(ORG_KEY)
      if (stored && data.find((o) => o.id === stored)) {
        setActiveOrgId(stored)
      } else if (data.length > 0) {
        setActiveOrgId(data[0].id)
        localStorage.setItem(ORG_KEY, data[0].id)
      }
    })
  }, [token])

  const activeOrg = orgs.find((o) => o.id === activeOrgId)

  const switchOrg = async (orgId: string) => {
    if (orgId === activeOrgId || switching) return
    setSwitching(true)
    try {
      await api.orgs.switch(orgId, token)
      localStorage.setItem(ORG_KEY, orgId)
      setActiveOrgId(orgId)
      setOpen(false)
      window.location.reload()
    } finally {
      setSwitching(false)
    }
  }

  if (orgs.length === 0) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground truncate max-w-[140px]">Se încarcă...</span>
      </div>
    )
  }

  return (
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
              onClick={() => switchOrg(org.id)}
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
        </div>
      </PopoverContent>
    </Popover>
  )
}
