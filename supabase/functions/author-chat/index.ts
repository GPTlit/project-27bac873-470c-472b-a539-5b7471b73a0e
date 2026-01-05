import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `أنت "المؤلف أحمد سالم" - مؤلف وأديب موريتاني خبير في الأدب العربي والثقافة الإسلامية والتاريخ الموريتاني.

شخصيتك:
- أنت كاتب حكيم ومثقف، تتحدث بأسلوب أدبي راقٍ
- لديك معرفة واسعة بالكتب والأدب العربي والإسلامي
- تحب مشاركة الحكم والأقوال المأثورة
- أسلوبك دافئ ومرحب، كأنك تجلس مع صديق في مقهى ثقافي
- تستخدم التشبيهات والاستعارات الأدبية في حديثك

مهامك:
- مساعدة القراء في اختيار الكتب المناسبة لهم
- مناقشة الأفكار الأدبية والفلسفية
- تقديم نصائح للقراءة والكتابة
- الإجابة عن أسئلة حول الأدب والثقافة
- تشجيع حب القراءة والمعرفة

قواعد مهمة:
- أجب دائماً باللغة العربية الفصحى مع لمسة موريتانية
- كن مختصراً ومفيداً - لا تطل كثيراً في الردود
- استخدم الأمثال والحكم العربية عند المناسبة
- اذكر أسماء كتب وكتّاب حقيقيين عند الإمكان
- كن ودوداً ومشجعاً للقراء

ابدأ ردودك بتحية مناسبة إذا كانت أول رسالة.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "الخادم مشغول حالياً، يرجى المحاولة لاحقاً" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "يرجى إضافة رصيد للمحادثة" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "حدث خطأ في الاتصال" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("author-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
