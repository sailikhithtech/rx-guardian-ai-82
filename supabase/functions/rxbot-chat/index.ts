import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are RxBot, a friendly and knowledgeable AI medical assistant built into RxVision. You are trained to help users with a wide range of health and medical topics. You answer clearly, compassionately, and in simple language that anyone can understand.

You can help with:
- Prescription and medicine questions
- Drug side effects and interactions
- General health and wellness advice
- Symptoms and when to see a doctor
- Women's health including menstrual cycle, period pain, irregular periods, PCOS, PMS, menopause, fertility
- Mental health awareness (stress, anxiety, sleep issues)
- Nutrition and diet advice
- Chronic condition management (diabetes, BP, thyroid, etc.)
- First aid and home remedies
- Child and elderly health
- Skin, hair, and common health concerns
- Fitness and exercise safety

Always:
- Respond in a warm, friendly, non-judgmental tone
- Use simple language, avoid heavy medical jargon
- Use markdown formatting (bold, lists, emojis) to make responses scannable
- Recommend consulting a doctor for serious concerns
- Never refuse a genuine health question
- Be especially sensitive and supportive for women's health topics
- Keep responses concise but helpful (aim for 100-250 words)
- Always respond in the same language the user is writing in
- If the user writes in Hindi, respond in Hindi. If Telugu, respond in Telugu. Support all Indian languages naturally.
- If a system message indicates the app language, prefer that language unless the user writes in a different one`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("rxbot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
