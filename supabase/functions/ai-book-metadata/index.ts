import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const ALLOWED_CATEGORIES = [
  "novels","religion","science","history","psychology","philosophy","kids","school",
  "poetry","self-help","fantasy","sci-fi","horror","thriller","crime","romance",
  "historical-fiction","adventure","action","drama","comedy","robots","mythic",
  "dark-fantasy","dark-humor","cosmic-horror","supernatural","uncanny-valley",
  "gothic-horror","analog-horror","zombies","survival","biography","mystery",
  "dystopia","apocalyptic","steampunk","cyberpunk","military","sports"
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { filename, textSample } = await req.json();
    if (!filename || typeof filename !== "string") {
      return new Response(JSON.stringify({ error: "filename required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sample = (textSample || "").slice(0, 6000);

    const systemPrompt = `أنت أمين مكتبة محترف وخبير في الأدب العربي والعالمي. مهمتك استخراج بيانات وصفية دقيقة لكتاب.

اعتمد على:
1. اسم الملف (قد يحتوي على العنوان والمؤلف).
2. مقتطف من محتوى الكتاب (الأول).
3. معرفتك الواسعة بالكتب المنشورة عالمياً وعربياً.

قواعد صارمة:
- تأكّد من اسم المؤلف الحقيقي للكتاب باستخدام معرفتك. لا تخمن. إذا لم تكن متأكداً 100% اكتب "غير معروف".
- العنوان يجب أن يكون العنوان الرسمي للكتاب (بالعربية إن وُجد، وإلا بلغته الأصلية).
- الوصف: 3-4 جمل بالعربية تلخص موضوع الكتاب وأهميته. استخدم المعلومات الموثوقة المعروفة عن الكتاب وليس فقط المقتطف.
- التصنيفات: اختر 1-3 من القائمة المسموحة فقط بناءً على الموضوع الحقيقي للكتاب.

التصنيفات المسموحة: ${ALLOWED_CATEGORIES.join(", ")}`;

    const userPrompt = `اسم الملف: ${filename}\n\nمقتطف من محتوى الكتاب:\n${sample}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "save_book_metadata",
            description: "Save extracted book metadata",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                author: { type: "string" },
                description: { type: "string" },
                categories: {
                  type: "array",
                  items: { type: "string", enum: ALLOWED_CATEGORIES },
                  minItems: 1,
                  maxItems: 3,
                },
              },
              required: ["title", "author", "description", "categories"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_book_metadata" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح، حاول لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد إلى مساحة العمل" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No metadata returned" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const metadata = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ metadata }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});