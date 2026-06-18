"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { api, type Org } from "@/lib/api"

const ORG_KEY = "nex_active_org_id"

interface OrgContextValue {
  orgs: Org[]
  activeOrgId: string
  activeOrg: Org | undefined
  switching: boolean
  switchOrg: (orgId: string) => Promise<void>
  createBrand: (name: string) => Promise<{ ok: boolean; limitReached?: boolean }>
}

const OrgContext = createContext<OrgContextValue>({
  orgs: [],
  activeOrgId: "",
  activeOrg: undefined,
  switching: false,
  switchOrg: async () => {},
  createBrand: async () => ({ ok: false }),
})

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [orgs, setOrgs] = useState<Org[]>([])
  const [activeOrgId, setActiveOrgId] = useState<string>("")
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

  const switchOrg = useCallback(async (orgId: string) => {
    if (orgId === activeOrgId || switching) return
    setSwitching(true)
    try {
      await api.orgs.switch(orgId, token)
      await fetch("/api/org/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      })
      localStorage.setItem(ORG_KEY, orgId)
      setActiveOrgId(orgId)
      window.location.reload()
    } finally {
      setSwitching(false)
    }
  }, [activeOrgId, switching, token])

  const createBrand = useCallback(async (name: string) => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002"
    const res = await fetch(`${API}/api/v1/orgs`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    if (res.status === 402) return { ok: false, limitReached: true }
    if (!res.ok) return { ok: false }
    const org: Org = await res.json()
    setOrgs((prev) => [...prev, org])
    await fetch("/api/org/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId: org.id }),
    })
    localStorage.setItem(ORG_KEY, org.id)
    setActiveOrgId(org.id)
    window.location.reload()
    return { ok: true }
  }, [token])

  const activeOrg = orgs.find((o) => o.id === activeOrgId)

  return (
    <OrgContext.Provider value={{ orgs, activeOrgId, activeOrg, switching, switchOrg, createBrand }}>
      {children}
    </OrgContext.Provider>
  )
}

export function useOrg() {
  return useContext(OrgContext)
}
