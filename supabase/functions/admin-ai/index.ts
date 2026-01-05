import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schemas
const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(10000, 'Message content too long'),
});

const actionPayloadSchemas = {
  toggle_feature: z.object({
    feature: z.string().max(100),
    enabled: z.boolean(),
  }),
  update_theme: z.object({
    colors: z.record(z.string().max(50)).optional(),
    fonts: z.record(z.string().max(100)).optional(),
  }),
  update_navigation: z.object({
    items: z.array(z.object({
      label: z.string().max(100),
      href: z.string().max(200),
    })).max(20),
  }),
  add_section: z.object({
    page: z.string().max(50),
    section: z.string().max(50),
    section_type: z.string().max(50).optional(),
    config: z.record(z.unknown()).optional(),
  }),
  remove_section: z.object({
    page: z.string().max(50),
    section: z.string().max(50),
  }),
  set_premium: z.object({
    book_id: z.string().uuid(),
    is_premium: z.boolean(),
    price: z.number().min(0).max(10000).optional(),
  }),
};

const executeActionSchema = z.object({
  type: z.enum(['toggle_feature', 'update_theme', 'update_navigation', 'add_section', 'remove_section', 'set_premium']),
  payload: z.record(z.unknown()),
});

const requestBodySchema = z.object({
  messages: z.array(messageSchema).max(100, 'Too many messages'),
  executeAction: executeActionSchema.optional(),
});

const SYSTEM_PROMPT = `You are an AI Admin Assistant for a digital library application. You can modify the app's configuration, features, and appearance by executing specific actions.

You have the following capabilities:

1. **Feature Toggles** - Enable/disable features:
   - comments: User comments on books
   - book_likes: Like/heart books
   - comment_likes: Like comments
   - premium_content: Premium/exclusive books
   - audiobooks: Audiobooks section
   - ratings: Book ratings
   - related_books: Related books section

2. **Theme Changes** - Modify colors (use HSL format like "43 74% 49%"):
   - primary: Main brand color
   - secondary: Secondary color
   - accent: Accent color
   - background: Background color
   - foreground: Text color

3. **Navigation** - Add/remove/reorder menu items

4. **Page Sections** - Add sections to pages:
   - book_detail: comments, likes, ratings, related_books
   - home: featured, categories, recent

5. **Premium Content** - Mark books as premium

When the user asks you to make a change, respond with a JSON action block that the system will execute. Format:

\`\`\`action
{
  "type": "toggle_feature" | "update_theme" | "update_navigation" | "add_section" | "remove_section" | "set_premium",
  "payload": { ... specific data for the action ... }
}
\`\`\`

Examples:

User: "Enable comments on book pages"
Response: I'll enable the comments feature for you.
\`\`\`action
{"type": "toggle_feature", "payload": {"feature": "comments", "enabled": true}}
\`\`\`

User: "Change the primary color to dark blue"
Response: I'll update the primary color to a dark blue.
\`\`\`action
{"type": "update_theme", "payload": {"colors": {"primary": "220 70% 40%"}}}
\`\`\`

User: "Make book with ID xyz premium"
Response: I'll mark that book as premium content.
\`\`\`action
{"type": "set_premium", "payload": {"book_id": "xyz", "is_premium": true, "price": 9.99}}
\`\`\`

User: "Add a ratings section to book detail page"
Response: I'll add a ratings section to the book detail page.
\`\`\`action
{"type": "add_section", "payload": {"page": "book_detail", "section": "ratings", "section_type": "ratings"}}
\`\`\`

Always explain what you're doing in Arabic (the app is in Arabic), then provide the action block. If the user asks something you can't do through configuration, explain politely that it requires code changes.

Current feature states will be provided in the conversation context.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate request body
    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parseResult = requestBodySchema.safeParse(rawBody);
    if (!parseResult.success) {
      console.error('Validation error:', parseResult.error.errors);
      return new Response(JSON.stringify({ 
        error: 'Invalid request format', 
        details: parseResult.error.errors.map(e => e.message).join(', ')
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages, executeAction } = parseResult.data;

    // If executing an action, handle it
    if (executeAction) {
      const result = await executeAdminAction(supabase, executeAction);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get current configuration for context
    const [featuresRes, themeRes, navRes] = await Promise.all([
      supabase.from('feature_toggles').select('*'),
      supabase.from('theme_config').select('*').eq('is_active', true).maybeSingle(),
      supabase.from('navigation_config').select('*').eq('position', 'header').maybeSingle(),
    ]);

    const contextMessage = `
Current App Configuration:
- Features: ${JSON.stringify(featuresRes.data || [])}
- Active Theme: ${JSON.stringify(themeRes.data || {})}
- Navigation: ${JSON.stringify(navRes.data || {})}
`;

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'system', content: contextMessage },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    return new Response(JSON.stringify({ message: aiMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in admin-ai function:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function executeAdminAction(supabase: any, action: z.infer<typeof executeActionSchema>) {
  console.log('Executing action:', action.type);
  
  try {
    // Validate action payload based on type
    const payloadSchema = actionPayloadSchemas[action.type];
    if (!payloadSchema) {
      return { success: false, message: 'Unknown action type' };
    }

    const payloadResult = payloadSchema.safeParse(action.payload);
    if (!payloadResult.success) {
      console.error('Payload validation error:', payloadResult.error.errors);
      return { 
        success: false, 
        message: `Invalid payload: ${payloadResult.error.errors.map(e => e.message).join(', ')}` 
      };
    }

    const validatedPayload = payloadResult.data;

    switch (action.type) {
      case 'toggle_feature': {
        const payload = validatedPayload as z.infer<typeof actionPayloadSchemas.toggle_feature>;
        const { error } = await supabase
          .from('feature_toggles')
          .update({ enabled: payload.enabled })
          .eq('feature_key', payload.feature);
        
        if (error) throw error;
        return { success: true, message: `Feature "${payload.feature}" ${payload.enabled ? 'enabled' : 'disabled'}` };
      }

      case 'update_theme': {
        const payload = validatedPayload as z.infer<typeof actionPayloadSchemas.update_theme>;
        const updateData: any = {};
        if (payload.colors) updateData.colors = payload.colors;
        if (payload.fonts) updateData.fonts = payload.fonts;

        // Get current theme and merge
        const { data: currentTheme } = await supabase
          .from('theme_config')
          .select('*')
          .eq('is_active', true)
          .maybeSingle();

        if (currentTheme) {
          if (payload.colors) {
            updateData.colors = { ...currentTheme.colors, ...payload.colors };
          }
          if (payload.fonts) {
            updateData.fonts = { ...currentTheme.fonts, ...payload.fonts };
          }

          const { error } = await supabase
            .from('theme_config')
            .update(updateData)
            .eq('id', currentTheme.id);

          if (error) throw error;
        }

        return { success: true, message: 'Theme updated successfully' };
      }

      case 'update_navigation': {
        const payload = validatedPayload as z.infer<typeof actionPayloadSchemas.update_navigation>;
        const { error } = await supabase
          .from('navigation_config')
          .update({ items: payload.items })
          .eq('position', 'header');

        if (error) throw error;
        return { success: true, message: 'Navigation updated successfully' };
      }

      case 'add_section': {
        const payload = validatedPayload as z.infer<typeof actionPayloadSchemas.add_section>;
        
        // First enable the related feature if exists
        await supabase
          .from('feature_toggles')
          .update({ enabled: true })
          .eq('feature_key', payload.section);

        const { error } = await supabase
          .from('page_sections')
          .upsert({
            page_key: payload.page,
            section_key: payload.section,
            section_type: payload.section_type || payload.section,
            config: payload.config || {},
            enabled: true,
          }, { onConflict: 'page_key,section_key' });

        if (error) throw error;
        return { success: true, message: `Section "${payload.section}" added to ${payload.page}` };
      }

      case 'remove_section': {
        const payload = validatedPayload as z.infer<typeof actionPayloadSchemas.remove_section>;
        const { error } = await supabase
          .from('page_sections')
          .update({ enabled: false })
          .eq('page_key', payload.page)
          .eq('section_key', payload.section);

        if (error) throw error;
        return { success: true, message: `Section "${payload.section}" removed from ${payload.page}` };
      }

      case 'set_premium': {
        const payload = validatedPayload as z.infer<typeof actionPayloadSchemas.set_premium>;
        
        // Enable premium feature if setting a book as premium
        if (payload.is_premium) {
          await supabase
            .from('feature_toggles')
            .update({ enabled: true })
            .eq('feature_key', 'premium_content');
        }

        const { error } = await supabase
          .from('books')
          .update({ is_premium: payload.is_premium, premium_price: payload.price || 0 })
          .eq('id', payload.book_id);

        if (error) throw error;
        return { success: true, message: `Book marked as ${payload.is_premium ? 'premium' : 'free'}` };
      }

      default:
        return { success: false, message: 'Unknown action type' };
    }
  } catch (error: any) {
    console.error('Action execution error:', error);
    return { success: false, message: error?.message || 'Unknown error' };
  }
}
