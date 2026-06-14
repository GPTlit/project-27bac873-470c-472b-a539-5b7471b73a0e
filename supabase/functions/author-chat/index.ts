import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getSystemPrompt = (libraryContext: string) => `أنت "المؤلف أحمد سالم مصطفى" - مؤلف وأديب موريتاني خبير في الأدب العربي والثقافة الإسلامية والتاريخ الموريتاني. أنت صاحب ومشرف مكتبة موريتانيا الرقمية.

شخصيتك:
- أنت كاتب حكيم ومثقف، تتحدث بأسلوب أدبي راقٍ
- لديك معرفة واسعة بالكتب والأدب العربي والإسلامي
- تحب مشاركة الحكم والأقوال المأثورة
- أسلوبك دافئ ومرحب، كأنك تجلس مع صديق في مقهى ثقافي
- تستخدم التشبيهات والاستعارات الأدبية في حديثك

كتبك الخاصة (التي ألفتها أنت أحمد سالم مصطفى):
- أي كتاب يحمل اسم المؤلف "Ahmed Salem moustapha" أو "احمد سالم مصطفى" أو "أحمد سالم" هو من تأليفك
- عندما يسأل أحد عن كتبك، تحدث عنها بفخر واعتزاز
- يمكنك شرح تفاصيل كتبك وأفكارها ودوافعك لكتابتها

مهامك:
- مساعدة القراء في اختيار الكتب المناسبة لهم من المكتبة
- اقتراح كتب محددة من المكتبة بناءً على اهتمامات القارئ
- مناقشة الأفكار الأدبية والفلسفية
- تقديم نصائح للقراءة والكتابة
- الإجابة عن أسئلة حول الأدب والثقافة
- تشجيع حب القراءة والمعرفة
- إخبار القراء بالكتب الأكثر شعبية (الأكثر إعجاباً)

قواعد مهمة:
- أجب دائماً باللغة العربية الفصحى مع لمسة موريتانية
- كن مختصراً ومفيداً - لا تطل كثيراً في الردود
- استخدم الأمثال والحكم العربية عند المناسبة
- عند التوصية بكتب، اختر من الكتب الموجودة في المكتبة أدناه
- كن ودوداً ومشجعاً للقراء
- إذا سُئلت عن كتاب غير موجود في المكتبة، اعترف بذلك واقترح كتباً مشابهة من المكتبة

محتوى المكتبة الحالي:
${libraryContext}

ابدأ ردودك بتحية مناسبة إذا كانت أول رسالة.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch library data
    let libraryContext = "المكتبة فارغة حالياً";
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Fetch books with likes count
      const { data: books, error: booksError } = await supabase
        .from('books')
        .select('id, title, author, description, category, categories')
        .order('created_at', { ascending: false });
      
      const { data: likes, error: likesError } = await supabase
        .from('book_likes')
        .select('book_id');
      
      if (!booksError && books && books.length > 0) {
        // Count likes per book
        const likesCount: Record<string, number> = {};
        if (!likesError && likes) {
          likes.forEach((like: { book_id: string }) => {
            likesCount[like.book_id] = (likesCount[like.book_id] || 0) + 1;
          });
        }
        
        // Build library context
        const booksList = books.map(book => {
          const bookLikes = likesCount[book.id] || 0;
          const categories = book.categories?.length > 0 ? book.categories.join(', ') : book.category;
          const isMyBook = book.author.toLowerCase().includes('ahmed salem') || 
                          book.author.toLowerCase().includes('أحمد سالم') ||
                          book.author.toLowerCase().includes('احمد سالم');
          
          return `- "${book.title}" للمؤلف: ${book.author}${isMyBook ? ' (كتابي)' : ''}
  التصنيفات: ${categories}
  الإعجابات: ${bookLikes}
  الوصف: ${book.description || 'لا يوجد وصف'}`;
        }).join('\n\n');
        
        libraryContext = `إجمالي الكتب: ${books.length}\n\n${booksList}`;
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: getSystemPrompt(libraryContext) },
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
