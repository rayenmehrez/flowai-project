import { supabase } from "./supabase"

// Agent management functions
export async function getAgent(agentId: string) {
  const { data, error } = await supabase.from("agents").select("*").eq("id", agentId).single()

  if (error) throw error
  return data
}

export async function getAgents() {
  const { data, error } = await supabase.from("agents").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function createAgent(agentData: any) {
  const { data, error } = await supabase.from("agents").insert([agentData]).select().single()

  if (error) throw error
  return data
}

export async function deleteAgent(agentId: string) {
  const { error } = await supabase.from("agents").delete().eq("id", agentId)

  if (error) throw error
}

// WhatsApp connection functions
export async function connectWhatsApp(agentId: string, phoneNumber: string) {
  const { data, error } = await supabase
    .from("whatsapp_connections")
    .insert([{ agent_id: agentId, phone_number: phoneNumber }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function disconnectWhatsApp(connectionId: string) {
  const { error } = await supabase.from("whatsapp_connections").delete().eq("id", connectionId)

  if (error) throw error
}

export async function generateQRCode(agentId: string) {
  const { data, error } = await supabase.functions.invoke("generate-qr-code", {
    body: { agentId },
  })

  if (error) throw error
  return data
}

export async function generatePairingCode(agentId: string) {
  const { data, error } = await supabase.functions.invoke("generate-pairing-code", {
    body: { agentId },
  })

  if (error) throw error
  return data
}

// Dashboard functions
export async function getDashboardOverview() {
  try {
    const { data, error } = await supabase.from("dashboard_stats").select("*").single()
    if (error) throw error
    return data
  } catch (err) {
    console.log("[v0] Dashboard stats not available, using defaults:", err)
    // Return sensible defaults when table doesn't exist
    return {
      totalMessages: 0,
      emailsProcessed: 0,
      videosGenerated: 0,
      postsPublished: 0,
    }
  }
}

// Profile functions
export async function updateProfile(userId: string, profileData: any) {
  const { data, error } = await supabase.from("profiles").update(profileData).eq("id", userId).select().single()

  if (error) throw error
  return data
}
