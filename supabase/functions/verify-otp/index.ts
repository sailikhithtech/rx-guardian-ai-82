import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, otp_code } = await req.json();
    if (!email || !otp_code) throw new Error("Email and OTP code are required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch latest OTP for this email
    const { data, error } = await supabase
      .from("otp_verification")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ verified: false, reason: "no_otp" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (new Date(data.expires_at) < new Date()) {
      await supabase.from("otp_verification").delete().eq("id", data.id);
      return new Response(JSON.stringify({ verified: false, reason: "expired" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check code
    if (data.otp_code !== otp_code) {
      return new Response(JSON.stringify({ verified: false, reason: "invalid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Success — delete OTP record
    await supabase.from("otp_verification").delete().eq("id", data.id);

    return new Response(JSON.stringify({ verified: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
