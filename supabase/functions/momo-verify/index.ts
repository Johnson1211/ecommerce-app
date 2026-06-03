import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSPayload {
  from?: string;
  message?: string;
  sender?: string;
  text?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const secret = url.searchParams.get("secret")
    const expectedSecret = Deno.env.get("MOMO_VERIFY_SECRET")

    if (expectedSecret && secret !== expectedSecret) {
      console.warn("Unauthorized request attempt: secret mismatch.")
      return new Response("Unauthorized", { status: 401, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables.")
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse incoming payload
    const body: SMSPayload = await req.json()
    console.log("Received SMS Payload:", JSON.stringify(body))

    // Some SMS gateways send 'text' or 'message' and 'sender' or 'from'
    const smsMessage = body.message || body.text
    const smsSender = body.from || body.sender

    if (!smsMessage) {
      return new Response(
        JSON.stringify({ error: "Missing message text in body." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Only process MTN MoMo (or general mobile money) messages
    const isMomoSMS = smsSender && (
      smsSender.toLowerCase().includes("momo") || 
      smsSender.toLowerCase().includes("mtn") ||
      smsSender.toLowerCase().includes("telecel") ||
      smsSender.toLowerCase().includes("airtel")
    )

    // Optional: You can remove this check if your gateway app only sends MoMo SMS
    if (smsSender && !isMomoSMS) {
      console.log(`Skipping SMS from non-MoMo sender: ${smsSender}`)
      return new Response(
        JSON.stringify({ status: "skipped", message: "Not a Mobile Money notification." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Parse MTN MoMo SMS patterns
    // Form 1: "... received GHS 10.00 from ... Transaction ID: 28394850384."
    // Form 2: "... Financial Transaction ID: 28394850384."
    const txIdMatch = smsMessage.match(/(?:Transaction ID|Financial Transaction ID|TxId):\s*([a-zA-Z0-9]+)/i)
    const transactionId = txIdMatch ? txIdMatch[1].trim() : null

    const amountMatch = smsMessage.match(/GHS\s*(\d+(?:\.\d{2})?)/i)
    const amount = amountMatch ? parseFloat(amountMatch[1]) : null

    console.log(`Parsed Transaction ID: ${transactionId}, Amount: GHS ${amount}`)

    if (!transactionId) {
      console.error("Failed to parse Transaction ID from SMS:", smsMessage)
      return new Response(
        JSON.stringify({ error: "Could not parse Transaction ID." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 1. Find matching pending order in Supabase
    // Using ilike or eq to match the transaction ID (case-insensitive)
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('momo_transaction_id', transactionId)
      .eq('status', 'pending')
      .maybeSingle()

    if (fetchError) {
      throw fetchError
    }

    if (!order) {
      console.warn(`No pending order found for Transaction ID: ${transactionId}`)
      return new Response(
        JSON.stringify({ status: "not_found", message: "No matching pending order found." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 2. Verify payment amount matches order total (within small floating-point margin)
    const orderTotal = parseFloat(order.total)
    if (amount !== null && Math.abs(amount - orderTotal) > 0.01) {
      console.error(`Amount mismatch! SMS received GHS ${amount}, but Order total is GHS ${orderTotal}`)
      
      // Update order status to failed due to mismatch, or add order notes
      await supabase
        .from('orders')
        .update({ 
          status: 'pending',
          items: [
            ...order.items,
            { note: `WARNING: SMS payment amount mismatch. Received GHS ${amount} instead of GHS ${orderTotal}.` }
          ]
        })
        .eq('id', order.id)

      return new Response(
        JSON.stringify({ status: "amount_mismatch", message: `Amount mismatch. Received GHS ${amount} instead of GHS ${orderTotal}.` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 3. Update order status to 'processing' (meaning payment is verified)
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'processing' })
      .eq('id', order.id)

    if (updateError) {
      throw updateError
    }

    console.log(`Successfully verified and approved Order ID: ${order.id} for Transaction ID: ${transactionId}`)
    return new Response(
      JSON.stringify({ status: "success", message: `Payment verified. Order status updated to processing.` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (err: any) {
    console.error("Edge Function Error:", err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
