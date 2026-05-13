import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "Backend not configured" }, 500);

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !userData.user) return json({ error: "Authentication required" }, 401);

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (roleError || !isAdmin) return json({ error: "Unauthorized" }, 403);

    const body = await req.json().catch(() => ({}));
    const title = String(body.title || "مكتبة موريتانيا").trim().slice(0, 120);
    const message = String(body.message || "You have a new update or saved file").trim().slice(0, 500);
    const targetUserIds = Array.isArray(body.userIds) ? body.userIds.filter(Boolean) : null;
    if (!title || !message) return json({ error: "Title and message are required" }, 400);

    let query = supabase
      .from("push_subscriptions")
      .select("token")
      .eq("enabled", true)
      .limit(1000);
    if (targetUserIds?.length) query = query.in("user_id", targetUserIds);

    const { data: subscriptions, error: tokenError } = await query;
    if (tokenError) return json({ error: tokenError.message }, 500);

    const tokens = [...new Set((subscriptions || []).map((row: { token: string }) => row.token).filter(Boolean))];
    if (tokens.length === 0) return json({ sent: 0, configured: Boolean(FCM_SERVER_KEY) });

    if (!FCM_SERVER_KEY) {
      return json({
        sent: 0,
        configured: false,
        message: "FCM_SERVER_KEY is required for background push notifications.",
      });
    }

    const results = await Promise.allSettled(tokens.map((token) => fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Authorization": `key=${FCM_SERVER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        notification: { title, body: message, sound: "default" },
        data: { title, message, source: "maktaba" },
        priority: "high",
      }),
    })));

    const sent = results.filter((result) => result.status === "fulfilled" && result.value.ok).length;
    return json({ sent, attempted: tokens.length, configured: true });
  } catch (e) {
    console.error("send-push-notifications error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
