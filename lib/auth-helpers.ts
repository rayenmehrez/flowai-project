import { supabase } from "./supabase"

export async function getCurrentUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user || null
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  localStorage.clear()
  window.location.href = "/login"
}

export async function checkAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return !!session
}
