import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { mode, bookTitle, author, passage, question, layerType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    let system = "";
    let user = "";
    if (mode === "ask") {
      system = "You are a thoughtful literary companion. Answer in the same language as the passage. Be concise (3-6 sentences) unless asked to elaborate.";
      user = `Book: "${bookTitle}" by ${author}\n\nPassage:\n"""${passage || ""}"""\n\nReader's question: ${question}`;
    } else if (mode === "layer") {
      const map: Record<string, string> = {
        quotes: "Extract 5-8 of the most powerful, quotable lines from this book. Return as a numbered list.",
        summary: "Write a clear, engaging summary of the book in 2-3 paragraphs.",
        analysis: "Write a deep literary analysis: themes, symbols, narrative techniques, philosophical undercurrents. 3-4 paragraphs.",
        secrets: "Share lesser-known author insights, historical context, hidden references, or biographical traces in this work. 2-3 paragraphs.",
      };
      system = "You are a master literary scholar. Always respond in Arabic unless the book title clearly indicates another language.";
      user = `Book: "${bookTitle}" by ${author}\n\nTask: ${map[layerType] || map.summary}`;
    } else {
      return new Response(JSON.stringify({ error: "invalid mode" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try later" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) {
      const t = await r.text();
      console.error("AI gateway", r.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ content }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});