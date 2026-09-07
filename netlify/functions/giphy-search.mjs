export default async (req) => {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  const key = process.env.GIPHY_API_KEY;
  if (!q) return new Response(JSON.stringify({ results: [] }), { headers: { "content-type": "application/json" } });
  if (!key) return new Response(JSON.stringify({ error: "Add GIPHY_API_KEY in Netlify environment variables." }), { status: 503, headers: { "content-type": "application/json" } });
  const r = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&limit=24&rating=pg-13`);
  const data = await r.json();
  return new Response(JSON.stringify({ results: (data.data || []).map(x => ({ url: x.images?.original?.url, preview: x.images?.fixed_width_small?.url, title: x.title })) }), { status: r.ok ? 200 : r.status, headers: { "content-type": "application/json" } });
};
