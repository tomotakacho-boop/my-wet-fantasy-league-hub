export const handler = async () => ({
  statusCode: 200,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
  body: JSON.stringify({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseKey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "",
  }),
});
