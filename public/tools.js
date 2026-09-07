(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v = "") => String(v).replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const modal = $("#tool-modal");
  const close = () => { if (modal) modal.hidden = true; };
  const open = kind => {
    $("#modal-kicker").textContent = kind === "meme" ? "MEME STUDIO" : "TRADE BLOCK";
    $("#modal-title").textContent = kind === "meme" ? "Build a meme for the channel" : "Put a player on the block";
    const content = $("#modal-content");
    if (kind === "trade") {
      const players = (league?.teams || []).flatMap(t => (t.roster || []).map(p => ({ ...p, team: t.name })));
      content.innerHTML = `<form class="tool-form" id="trade-form"><label>Player name</label><input id="trade-player" autocomplete="off" placeholder="Start typing a player…" required><div class="player-suggestions" id="player-suggestions"></div><label>What are you looking for?</label><textarea id="trade-note" placeholder="Open to offers…"></textarea><button>Add player</button></form>`;
      const input = $("#trade-player"), list = $("#player-suggestions");
      input.oninput = () => { const q = input.value.toLowerCase().trim(); list.innerHTML = q ? players.filter(p => p.fullName.toLowerCase().includes(q)).slice(0, 8).map(p => `<button type="button" data-name="${esc(p.fullName)}" data-meta="${esc(p.position)} · ${esc(p.team)}">${esc(p.fullName)} · ${esc(p.position)} · ${esc(p.team)}</button>`).join("") : ""; list.querySelectorAll("button").forEach(b => b.onclick = () => { input.value = b.dataset.name; input.dataset.meta = b.dataset.meta; list.innerHTML = ""; }); };
      $("#trade-form").onsubmit = async e => { e.preventDefault(); if (!user) return toast("Sign in to use the trade block."); const note = $("#trade-note").value.trim(); const r = await db.from("messages").insert({ channel: "trade-talk", user_id: user.id, author_name: user.user_metadata?.full_name || user.email.split("@")[0], content: `📣 Put ${input.value.trim()} (${input.dataset.meta || "player"}) on the trade block.${note ? ` ${note}` : ""}` }); if (r.error) toast(r.error.message); else { close(); channel = "trade-talk"; loadMessages(); } };
    } else {
      content.innerHTML = `<form class="tool-form" id="meme-form"><label>Base image</label><input id="meme-file" type="file" accept="image/*" required><label>Top / white-bar text</label><input id="meme-top" placeholder="Optional top caption"><label>Bottom text</label><input id="meme-bottom" placeholder="Optional bottom caption"><button>Post meme</button></form>`;
      $("#meme-form").onsubmit = async e => { e.preventDefault(); if (!user) return toast("Sign in to post a meme."); const file = $("#meme-file").files[0]; if (!file) return; try { const mediaUrl = await upload(file), r = await db.from("messages").insert({ channel: "memes", user_id: user.id, author_name: user.user_metadata?.full_name || user.email.split("@")[0], content: `${$("#meme-top").value} ${$("#meme-bottom").value}`.trim(), media_url: mediaUrl }); if (r.error) throw r.error; close(); channel = "memes"; loadMessages(); } catch (err) { toast(err.message); } };
    }
    modal.hidden = false;
  };
  const update = () => { let tools = $(".channel-tools"); if (!tools) { tools = document.createElement("div"); tools.className = "channel-tools"; tools.innerHTML = `<button id="trade-tool" type="button">＋ Trade block</button><button id="meme-tool" type="button">＋ Create meme</button>`; $(".channel-header").append(tools); $("#trade-tool").onclick = () => open("trade"); $("#meme-tool").onclick = () => open("meme"); } $("#trade-tool").hidden = channel !== "trade-talk"; $("#meme-tool").hidden = channel !== "memes"; };
  $("#modal-close").onclick = close; modal.onclick = e => { if (e.target === modal) close(); };
  document.querySelectorAll("[data-channel]").forEach(b => b.addEventListener("click", () => setTimeout(update, 0)));
  setTimeout(update, 0);
})();
