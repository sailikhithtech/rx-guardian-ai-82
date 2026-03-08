import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, name } = await req.json();
    if (!email) throw new Error("Email is required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Delete any existing OTPs for this email
    await supabase.from("otp_verification").delete().eq("email", email);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP
    const { error: insertError } = await supabase.from("otp_verification").insert({
      email,
      otp_code: otp,
    });
    if (insertError) throw insertError;

    // Send via EmailJS REST API
    const serviceId = Deno.env.get("EMAILJS_SERVICE_ID")!;
    const templateId = Deno.env.get("EMAILJS_TEMPLATE_ID")!;
    const publicKey = Deno.env.get("EMAILJS_PUBLIC_KEY")!;

    const emailRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          name: name || "User",
          email: email,
          otp_code: otp,
        },
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      throw new Error(`EmailJS failed: ${errText}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
