(() => {
  const $ = s => document.querySelector(s);
  const composer = $("#message-form");
  const placeActions = () => { const tools = $(".channel-tools"); if (tools && composer && !composer.contains(tools)) composer.prepend(tools); };
  setTimeout(placeActions, 300);
  document.querySelectorAll("[data-channel]").forEach(b => b.addEventListener("click", () => setTimeout(placeActions, 50)));
  const gif = $("#gif-button");
  if (gif) gif.onclick = async () => {
    if (typeof user === "undefined" || !user) return toast("Sign in to add a GIF.");
    const query = prompt("Search GIPHY for a GIF"); if (!query) return;
    try { const r = await fetch(`/api/giphy-search?q=${encodeURIComponent(query)}`); const data = await r.json(); if (!r.ok) throw Error(data.error || "GIPHY search is not configured yet."); const choice = data.results?.[0]; if (!choice) return toast("No GIFs found."); pendingMedia = choice.url; toast(`GIF ready: ${choice.title || query}`); } catch (e) { toast(e.message); window.open(`https://giphy.com/search/${encodeURIComponent(query)}`, "_blank", "noopener"); }
  };
})();
