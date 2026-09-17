/**
 * Tax Delinquency Scraper API
 * Serves pre-scraped San Bernardino County tax delinquency data
 * via Cloudflare Workers + Pages.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // GET /api/delinquent?county=sb&minYears=4
    if (url.pathname === "/api/delinquent") {
      const minYears = parseInt(url.searchParams.get("minYears") || "4", 10);
      const county = url.searchParams.get("county") || "sb";

      // Fetch from KV cache first
      const cacheKey = `delinquent-${county}-${minYears}`;
      const cached = await env.RESULTS_KV.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: { "Content-Type": "application/json", "Cache-Control": "s-maxage=3600" },
        });
      }

      // Fallback: read from R2 or return empty
      return new Response(JSON.stringify({ error: "No data cached yet. Run the scraper first." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // GET /api/search?parcel=1234-AB-5678
    if (url.pathname === "/api/search") {
      const parcelId = url.searchParams.get("parcel");
      if (!parcelId) {
        return new Response(JSON.stringify({ error: "Missing parcel parameter" }), { status: 400 });
      }
      const cacheKey = `parcel-${parcelId}`;
      const cached = await env.RESULTS_KV.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: { "Content-Type": "application/json", "Cache-Control": "s-maxage=3600" },
        });
      }
      return new Response(JSON.stringify({ error: "Parcel not found" }), { status: 404 });
    }

    // GET /api/stats
    if (url.pathname === "/api/stats") {
      const stats = await env.RESULTS_KV.get("stats");
      return new Response(stats || JSON.stringify({ total: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Serve static files for the web UI
    return fetch(request);
  },
};