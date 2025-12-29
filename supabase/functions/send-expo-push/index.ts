import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  badge?: number;
  channelId?: string;
  priority?: "default" | "normal" | "high";
}

interface PushRequest {
  userId?: string;
  userIds?: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channelId?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, userIds, title, body, data, channelId }: PushRequest = await req.json();

    // Get target user IDs
    const targetUserIds = userIds || (userId ? [userId] : []);
    
    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "userId or userIds is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch push tokens from database
    const { data: tokens, error: tokenError } = await supabaseClient
      .from("push_tokens")
      .select("token, user_id")
      .in("user_id", targetUserIds);

    if (tokenError) {
      console.error("Error fetching tokens:", tokenError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch push tokens" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ message: "No push tokens found for users", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Expo push messages
    const messages: ExpoPushMessage[] = tokens
      .filter((t) => t.token && t.token.startsWith("ExponentPushToken"))
      .map((t) => ({
        to: t.token,
        title,
        body,
        data: data || {},
        sound: "default",
        priority: "high",
        ...(channelId && { channelId }),
      }));

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ message: "No valid Expo push tokens", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send to Expo Push API
    const expoPushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const expoPushResult = await expoPushResponse.json();

    // Log results
    console.log("Expo Push Result:", JSON.stringify(expoPushResult));

    return new Response(
      JSON.stringify({
        success: true,
        sent: messages.length,
        result: expoPushResult,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending push notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
