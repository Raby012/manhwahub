import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "/manga";
    const query = url.searchParams.get("query") || "";

    const mangadexUrl = `https://api.mangadex.org${path}${query ? `?${query}` : ""}`;

    const response = await fetch(mangadexUrl, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`MangaDex API error: ${response.status} - ${errorText}`);
      const isFallbackable = response.status >= 500;
      return new Response(
        JSON.stringify({
          error: isFallbackable ? "SERVICE_UNAVAILABLE" : `API error: ${response.status}`,
          fallback: isFallbackable,
        }),
        {
          status: isFallbackable ? 200 : response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in mangadex-proxy:", error);
    return new Response(
      JSON.stringify({ error: "SERVICE_FAILED", fallback: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});