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

    // Fallback chain: each model takes over only when the previous one is
    // out of credits / rate limited / failing.
    const MODEL_CHAIN = [
      "google/gemini-2.5-flash",
      "google/gemini-3.7-flash",
      "google/gemini-2.5-flash-lite",
      "google/gemini-3.1-flash-lite",
    ];

    const callModel = (model: string) =>
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
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

    let metadata: unknown = null;
    let usedModel = "";
    let lastStatus = 0;
    let lastError = "";

    for (const model of MODEL_CHAIN) {
      let aiResp: Response;
      try {
        aiResp = await callModel(model);
      } catch (err) {
        lastStatus = 503;
        lastError = err instanceof Error ? err.message : "network error";
        console.warn(`[${model}] network failure, trying next model`);
        continue;
      }

      if (!aiResp.ok) {
        lastStatus = aiResp.status;
        lastError = await aiResp.text();
        // 402 credits exhausted, 429 rate limited, 5xx upstream -> next model
        if (aiResp.status === 402 || aiResp.status === 429 || aiResp.status >= 500) {
          console.warn(`[${model}] ${aiResp.status} -> falling back to next model`);
          continue;
        }
        console.error(`[${model}] terminal error`, aiResp.status, lastError);
        break;
      }

      const data = await aiResp.json();
      const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        lastStatus = 502;
        lastError = "no tool call returned";
        console.warn(`[${model}] no metadata returned -> next model`);
        continue;
      }
      try {
        metadata = JSON.parse(toolCall.function.arguments);
        usedModel = model;
        break;
      } catch {
        lastStatus = 502;
        lastError = "bad metadata JSON";
        continue;
      }
    }

    if (!metadata) {
      const status = lastStatus === 402 ? 402 : lastStatus === 429 ? 429 : 500;
      const message =
        status === 402
          ? "انتهى رصيد جميع نماذج الذكاء الاصطناعي، يرجى إضافة رصيد"
          : status === 429
          ? "تم تجاوز الحد المسموح في جميع النماذج، حاول لاحقاً"
          : "فشل استخراج البيانات من جميع النماذج";
      console.error("all models failed", lastStatus, lastError);
      return new Response(JSON.stringify({ error: message }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ metadata, model: usedModel }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});