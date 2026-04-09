import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GNewsArticle {
  title: string;
  description?: string;
  url?: string;
  image?: string;
  publishedAt?: string;
  source?: { name?: string };
}

async function hashContent(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const gnewsKey = Deno.env.get("GNEWS_API_KEY");

  const supabase = createClient(supabaseUrl, serviceKey);

  if (!gnewsKey) {
    await supabase.from("news_fetch_log").insert({
      status: "error",
      articles_count: 0,
      error_message: "GNEWS_API_KEY not configured",
      provider: "gnews",
    });

    return new Response(
      JSON.stringify({ error: "GNEWS_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const params = new URLSearchParams({
      lang: "en",
      country: "us",
      max: "10",
      apikey: gnewsKey,
    });

    const res = await fetch(`https://gnews.io/api/v4/top-headlines?${params}`);
    const data = await res.json();

    // Check for API errors
    if (data.errors || !res.ok) {
      const errMsg =
        (Array.isArray(data.errors) && data.errors[0]) ||
        data.message ||
        "GNews API error";

      await supabase.from("news_fetch_log").insert({
        status: "error",
        articles_count: 0,
        error_message: String(errMsg),
        provider: "gnews",
      });

      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const articles: GNewsArticle[] = Array.isArray(data.articles) ? data.articles : [];

    let inserted = 0;

    for (const article of articles) {
      const contentHash = await hashContent(article.title + (article.url || ""));

      const { error } = await supabase.from("news_cache").upsert(
        {
          title: article.title,
          description: article.description || null,
          url: article.url || null,
          image_url: article.image || null,
          source: article.source?.name || "Unknown",
          published_at: article.publishedAt || null,
          content_hash: contentHash,
          imported_at: new Date().toISOString(),
        },
        { onConflict: "content_hash" }
      );

      if (!error) inserted++;
    }

    // Cleanup: keep only the 100 most recent articles
    const MAX_ARTICLES = 100;
    const { data: oldRows } = await supabase
      .from("news_cache")
      .select("id")
      .order("published_at", { ascending: false })
      .range(MAX_ARTICLES, MAX_ARTICLES + 999);

    if (oldRows && oldRows.length > 0) {
      const idsToDelete = oldRows.map((r: { id: string }) => r.id);
      await supabase.from("news_cache").delete().in("id", idsToDelete);
    }

    await supabase.from("news_fetch_log").insert({
      status: "success",
      articles_count: inserted,
      provider: "gnews",
    });

    return new Response(
      JSON.stringify({ success: true, articles_synced: inserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";

    await supabase.from("news_fetch_log").insert({
      status: "error",
      articles_count: 0,
      error_message: errMsg,
      provider: "gnews",
    });

    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
