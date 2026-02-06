import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const submissionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  author: z.string().min(1, 'Author is required').max(100, 'Author too long'),
  category: z.string().min(1, 'Category is required').max(50, 'Category too long'),
  message: z.string().max(500, 'Message too long').optional().nullable(),
  fileUrl: z.string().url('Invalid file URL').max(500, 'URL too long'),
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('Missing authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'يجب تسجيل الدخول لإرسال طلب' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with user's auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('Invalid auth token:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Authenticated user:', user.id);

    // Parse and validate input
    const body = await req.json();
    const validationResult = submissionSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'بيانات غير صالحة',
          details: validationResult.error.errors.map(e => e.message)
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { title, author, category, message, fileUrl } = validationResult.data;
    
    console.log('Validated submission:', { title, author, category, fileUrl });

    // Format message for WhatsApp
    const whatsappMessage = `📚 طلب كتاب جديد:

📖 العنوان: ${title}
✍️ المؤلف: ${author}
📁 التصنيف: ${category}
${message ? `💬 ملاحظة: ${message}` : ''}
🔗 الملف: ${fileUrl}`;

    // WhatsApp API URL (using wa.me for deep link)
    const phoneNumber = '22226749039'; // Library WhatsApp number
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    console.log('Generated WhatsApp URL for user:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        whatsappUrl,
        message: 'تم إرسال طلب الكتاب بنجاح'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'حدث خطأ في معالجة الطلب' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
