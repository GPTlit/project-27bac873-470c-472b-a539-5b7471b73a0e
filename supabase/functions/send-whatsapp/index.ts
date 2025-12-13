import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, author, category, message, fileUrl } = await req.json();
    
    console.log('Received submission:', { title, author, category, message, fileUrl });

    // Format message for WhatsApp
    const whatsappMessage = `📚 طلب كتاب جديد:

📖 العنوان: ${title}
✍️ المؤلف: ${author}
📁 التصنيف: ${category}
${message ? `💬 ملاحظة: ${message}` : ''}
🔗 الملف: ${fileUrl}`;

    // WhatsApp API URL (using wa.me for deep link)
    const phoneNumber = '22226749039'; // Your WhatsApp number without +
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    console.log('Generated WhatsApp URL:', whatsappUrl);

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
