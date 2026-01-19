"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "./supabase"

export interface AppUser extends User {
  full_name?: string
  role?: string
  permissions?: string[]
  credits?: number
}

interface AuthContextType {
  user: AppUser | null
  session: Session | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserProfile = async (authUser: User): Promise<AppUser> => {
    // Skip fetching from user_profiles table due to RLS recursion issues
    // Use user_metadata from auth user instead
    return {
      ...authUser,
      full_name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0],
      role: authUser.user_metadata?.role,
      permissions: authUser.user_metadata?.permissions || [],
      credits: authUser.user_metadata?.credits || 0,
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)

      if (data.session?.user) {
        const mergedUser = await loadUserProfile(data.session.user)
        setUser(mergedUser)
      } else {
        setUser(null)
      }

      setLoading(false)
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)

      if (session?.user) {
        const mergedUser = await loadUserProfile(session.user)
        setUser(mergedUser)
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
