(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const modal = $("#tool-modal"), content = $("#modal-content"), area = $("#message-area"), composer = $("#message-form");
  const name = () => chatDisplayName();
  const safe = (value = "") => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const proTeams = {0:"FA",1:"ATL",2:"BUF",3:"CHI",4:"CIN",5:"CLE",6:"DAL",7:"DEN",8:"DET",9:"GB",10:"TEN",11:"IND",12:"KC",13:"LV",14:"LAR",15:"MIA",16:"MIN",17:"NE",18:"NO",19:"NYG",20:"NYJ",21:"PHI",22:"ARI",23:"PIT",24:"LAC",25:"SF",26:"SEA",27:"TB",28:"WAS",29:"CAR",30:"JAX",33:"BAL",34:"HOU"};
  let chosenPlayer = null, previewUrl = null;

  function closeModal() { modal.hidden = true; content.innerHTML = ""; chosenPlayer = null; }
  function activate(next) { document.querySelector(`[data-channel="${next}"]`)?.click(); }
  function players() {
    return (league?.teams || []).flatMap(team => (team.roster || []).map(player => ({
      id: player.id, name: player.fullName, position: player.position || "—", nflTeam: player.proTeam || player.nflTeam || proTeams[player.proTeamId] || "FA", fantasyTeam: team.name, fantasyTeamId: String(team.id)
    }))).sort((a, b) => a.name.localeCompare(b.name));
  }

  function openModal(kind) {
    if (!user) return toast(kind === "meme" ? "Sign in to create a meme." : "Sign in to use the trade block.");
    $("#modal-kicker").textContent = kind === "meme" ? "MEME STUDIO" : "TRADE BLOCK";
    $("#modal-title").textContent = kind === "meme" ? "Build a meme for the channel" : "Put a player on the block";
    modal.classList.toggle("is-meme-modal", kind === "meme");
    kind === "meme" ? memeStudio() : tradeForm();
    modal.hidden = false;
  }

  function tradeForm() {
    content.innerHTML = `<form class="tool-form trade-form" id="trade-form">
      <label for="trade-player">Player name</label><div class="combobox-wrap"><input id="trade-player" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="player-suggestions" placeholder="Start typing a rostered player…" required><div class="player-suggestions" id="player-suggestions" role="listbox"></div></div>
      <div class="trade-meta-fields"><label>Position<input id="trade-position" value="—" readonly></label><label>NFL team<input id="trade-nfl-team" value="—" readonly></label></div>
      <label for="trade-note">What are you looking for?</label><textarea id="trade-note" maxlength="500" placeholder="Open to offers…"></textarea>
      <div class="modal-actions"><button class="secondary-button" type="button" data-close-modal>Cancel</button><button type="submit">Add player</button></div></form>`;
    const input = $("#trade-player"), suggestions = $("#player-suggestions"), roster = players();
    const choose = player => { chosenPlayer = player; input.value = player.name; input.setAttribute("aria-expanded", "false"); $("#trade-position").value = player.position; $("#trade-nfl-team").value = player.nflTeam; suggestions.innerHTML = ""; };
    input.oninput = () => {
      chosenPlayer = null; $("#trade-position").value = "—"; $("#trade-nfl-team").value = "—";
      const query = input.value.trim().toLowerCase(), matches = query ? roster.filter(player => player.name.toLowerCase().includes(query)).slice(0, 10) : [];
      input.setAttribute("aria-expanded", String(matches.length > 0));
      suggestions.innerHTML = matches.map((player, index) => `<button type="button" role="option" data-player-index="${index}"><strong>${safe(player.name)}</strong><span>${safe(player.position)} · ${safe(player.nflTeam)} · ${safe(player.fantasyTeam)}</span></button>`).join("");
      $$('[data-player-index]', suggestions).forEach(button => button.onclick = () => choose(matches[Number(button.dataset.playerIndex)]));
    };
    $("[data-close-modal]").onclick = closeModal;
    $("#trade-form").onsubmit = async event => {
      event.preventDefault();
      if (!chosenPlayer) return toast("Choose a player from the roster list.");
      const note = $("#trade-note").value.trim();
      const result = await db.from("trade_block_items").insert({ user_id:user.id, author_name:name(), author_team_id:chosenPlayer.fantasyTeamId, author_team_name:chosenPlayer.fantasyTeam, player_name:chosenPlayer.name, position:chosenPlayer.position, nfl_team:chosenPlayer.nflTeam, note });
      if (result.error) return toast(result.error.message);
      await db.from("messages").insert({ channel:"trade-talk", user_id:user.id, author_name:name(), content:`📣 ${name()} put ${chosenPlayer.name} on the trade block.${note ? ` ${note}` : ""}` });
      closeModal(); activate("trade-talk"); await loadTradeBlock(); loadMessages();
    };
  }

  async function loadTradeBlock() {
    const host = $("#channel-plugin-content");
    if (!host || channel !== "trade-talk") return;
    if (!user || !db) { host.innerHTML = '<p class="plugin-empty">Sign in to see the league trade block.</p>'; return; }
    const [itemsResult, interestsResult] = await Promise.all([db.from("trade_block_items").select("*").eq("status", "open").order("created_at", {ascending:false}), db.from("trade_interests").select("trade_item_id,user_id")]);
    if (itemsResult.error) { host.innerHTML = '<p class="plugin-empty">Run the updated Supabase setup to turn on the trade block.</p>'; return; }
    const interests = interestsResult.data || [];
    host.innerHTML = itemsResult.data.length ? `<div class="trade-card-grid">${itemsResult.data.map(item => {
      const votes = interests.filter(vote => vote.trade_item_id === item.id), interested = votes.some(vote => vote.user_id === user.id);
      return `<article class="trade-card"><div class="trade-position">${safe(item.position || "—")}</div><div class="trade-card-copy"><small>${safe(item.nfl_team || "FA")} · offered by ${safe(item.author_name)}</small><h3>${safe(item.player_name)}</h3><p>${safe(item.note || "Open to offers.")}</p><span>${safe(item.author_team_name || "League roster")}</span></div><div class="trade-card-actions"><button type="button" class="interest-button ${interested ? "is-active" : ""}" data-interest-id="${item.id}" data-interested="${interested}">${interested ? "Interested" : "Show interest"}${votes.length ? ` · ${votes.length}` : ""}</button>${item.user_id === user.id ? `<button type="button" class="close-trade-button" data-close-trade="${item.id}">Close</button>` : ""}</div></article>`;
    }).join("")}</div>` : '<p class="plugin-empty">Nobody is on the block yet. Be the first to stir things up.</p>';
    $$('[data-interest-id]', host).forEach(button => button.onclick = async () => {
      const id = Number(button.dataset.interestId), result = button.dataset.interested === "true" ? await db.from("trade_interests").delete().eq("trade_item_id", id).eq("user_id", user.id) : await db.from("trade_interests").insert({trade_item_id:id,user_id:user.id});
      result.error ? toast(result.error.message) : loadTradeBlock();
    });
    $$('[data-close-trade]', host).forEach(button => button.onclick = async () => { const result = await db.from("trade_block_items").update({status:"closed"}).eq("id", Number(button.dataset.closeTrade)); result.error ? toast(result.error.message) : loadTradeBlock(); });
  }

  function memeStudio() {
    content.innerHTML = `<form class="tool-form meme-studio" id="meme-form"><div class="meme-controls">
      <label for="meme-file">Base image</label><input id="meme-file" type="file" accept="image/jpeg,image/png,image/webp" required>
      <label class="check-row"><input id="meme-white-bar" type="checkbox"><span>Add classic white caption bar</span></label>
      <label for="meme-top">Top / white-bar text</label><input id="meme-top" maxlength="180" placeholder="Top caption">
      <label for="meme-bottom">Bottom text</label><input id="meme-bottom" maxlength="180" placeholder="Bottom caption">
      <label for="meme-overlay">Optional photo overlay</label><input id="meme-overlay" type="file" accept="image/jpeg,image/png,image/webp">
      <div class="slider-grid"><label>Overlay X<input id="overlay-x" type="range" min="0" max="100" value="72"></label><label>Overlay size<input id="overlay-size" type="range" min="10" max="70" value="28"></label></div></div>
      <div class="meme-preview-panel"><span>LIVE PREVIEW</span><canvas id="meme-preview" class="meme-preview" width="900" height="600"></canvas><p>Captions and photo overlays update as you edit.</p></div>
      <div class="modal-actions meme-actions"><button class="secondary-button" type="button" data-close-modal>Cancel</button><button type="submit">Post meme</button></div></form>`;
    const canvas = $("#meme-preview"), ctx = canvas.getContext("2d"); let base = null, overlay = null;
    function loadImage(file, setter) { if (!file) return setter(null); const image = new Image(); image.onload = () => { setter(image); draw(); }; image.src = URL.createObjectURL(file); }
    function wrap(text, width) { const lines=[]; let line=""; text.trim().split(/\s+/).filter(Boolean).forEach(word => { const test=line?`${line} ${word}`:word; if(ctx.measureText(test).width>width&&line){lines.push(line);line=word}else line=test; }); if(line)lines.push(line); return lines.slice(0,4); }
    function caption(text, y, bottom=false) { if(!text.trim())return; const size=Math.max(34,Math.min(68,canvas.width/12)); ctx.font=`900 ${size}px Arial,sans-serif`;ctx.textAlign="center";ctx.textBaseline=bottom?"bottom":"top";ctx.lineJoin="round";const lines=wrap(text.toUpperCase(),canvas.width-70),height=size*1.06;lines.forEach((line,i)=>{const ly=bottom?y-(lines.length-1-i)*height:y+i*height;ctx.strokeStyle="#000";ctx.lineWidth=Math.max(6,size/8);ctx.strokeText(line,canvas.width/2,ly);ctx.fillStyle="#fff";ctx.fillText(line,canvas.width/2,ly);}); }
    function draw() {
      if(!base){canvas.width=900;canvas.height=600;ctx.fillStyle="#e9e6df";ctx.fillRect(0,0,900,600);ctx.fillStyle="#697286";ctx.font="700 28px Arial";ctx.textAlign="center";ctx.fillText("Choose an image to start your meme",450,300);return;}
      const width=900,imageHeight=Math.round(Math.min(850,Math.max(360,width*base.height/base.width))),whiteBar=$("#meme-white-bar").checked,barHeight=whiteBar?150:0;canvas.width=width;canvas.height=imageHeight+barHeight;ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(base,0,barHeight,width,imageHeight);
      const top=$("#meme-top").value,bottom=$("#meme-bottom").value;if(whiteBar&&top.trim()){ctx.fillStyle="#111";ctx.font="800 43px Arial";ctx.textAlign="center";ctx.textBaseline="middle";const lines=wrap(top,width-70).slice(0,2);lines.forEach((line,i)=>ctx.fillText(line,width/2,75+(i-(lines.length-1)/2)*48));}else caption(top,barHeight+24);caption(bottom,canvas.height-24,true);
      if(overlay){const ow=width*Number($("#overlay-size").value)/100,oh=ow*overlay.height/overlay.width,x=(width-ow)*Number($("#overlay-x").value)/100,y=barHeight+(imageHeight-oh)/2;ctx.drawImage(overlay,x,y,ow,oh);}
    }
    $("#meme-file").onchange=e=>loadImage(e.target.files[0],image=>base=image);$("#meme-overlay").onchange=e=>loadImage(e.target.files[0],image=>overlay=image);["#meme-white-bar","#meme-top","#meme-bottom","#overlay-x","#overlay-size"].forEach(selector=>$(selector).oninput=draw);$("[data-close-modal]").onclick=closeModal;draw();
    $("#meme-form").onsubmit=async event=>{event.preventDefault();if(!base)return toast("Choose a base image first.");const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png",.94));try{const mediaUrl=await upload(new File([blob],`meme-${Date.now()}.png`,{type:"image/png"})),result=await db.from("messages").insert({channel:"memes",user_id:user.id,author_name:name(),content:"",media_url:mediaUrl});if(result.error)throw result.error;closeModal();activate("memes");loadMessages();}catch(error){toast(error.message)}};
  }

  function ensurePlugin() {
    if(!["trade-talk","memes"].includes(channel)||$("#channel-plugin"))return;const welcome=$(".feed-welcome",area);if(!welcome)return;
    const plugin=document.createElement("section");plugin.id="channel-plugin";plugin.className="channel-plugin";plugin.innerHTML=channel==="trade-talk"?'<div class="channel-plugin-heading"><div><h2>Trade block</h2><p>Add a rostered player and see who is interested.</p></div><button type="button" data-open-tool>＋ Add player</button></div><div id="channel-plugin-content"></div>':'<div class="channel-plugin-heading"><div><h2>Meme creator</h2><p>Create and preview a meme before posting it.</p></div><button type="button" data-open-tool>＋ Create a meme</button></div><div id="channel-plugin-content"><p class="plugin-empty">Posted memes appear in the channel below.</p></div>';welcome.insertAdjacentElement("afterend",plugin);$("[data-open-tool]",plugin).onclick=()=>openModal(channel==="memes"?"meme":"trade");if(channel==="trade-talk")loadTradeBlock();
  }
  function composerTool(){let button=$("#channel-action-button");composer.classList.toggle("is-meme-channel",channel==="memes");if(!["trade-talk","memes"].includes(channel)){button?.remove();return;}if(!button){button=document.createElement("button");button.id="channel-action-button";button.type="button";button.className="channel-action-button";composer.prepend(button);}button.textContent=channel==="trade-talk"?"＋ Trade block":"＋ Create meme";button.onclick=()=>openModal(channel==="trade-talk"?"trade":"meme");}
  function mediaPreview(url,title="Selected media"){let preview=$("#composer-preview");if(!preview){preview=document.createElement("div");preview.id="composer-preview";preview.className="composer-preview";composer.insertAdjacentElement("afterend",preview);}preview.innerHTML=`<img src="${safe(url)}" alt=""><span>${safe(title)}</span><button type="button" aria-label="Remove attachment">×</button>`;$("button",preview).onclick=()=>{pendingMedia=null;preview.remove();};}
  function gifPicker(){if(!user)return toast("Sign in to add a GIF.");let picker=$("#gif-picker");if(picker){picker.remove();return;}picker=document.createElement("section");picker.id="gif-picker";picker.className="gif-picker";picker.innerHTML='<div class="gif-search-row"><input id="gif-query" autocomplete="off" placeholder="Search GIPHY"><button id="gif-search" type="button">Search</button><button id="gif-close" type="button" aria-label="Close GIF picker">×</button></div><div class="gif-results" id="gif-results"><p>Search millions of GIFs from GIPHY.</p></div><small>Powered by GIPHY</small>';composer.insertAdjacentElement("afterend",picker);$("#gif-close").onclick=()=>picker.remove();const search=async()=>{const query=$("#gif-query").value.trim();if(!query)return;const results=$("#gif-results");results.innerHTML="<p>Searching…</p>";try{const response=await fetch(`/api/giphy-search?q=${encodeURIComponent(query)}`),data=await response.json();if(!response.ok)throw Error(data.error||"GIPHY search is unavailable.");results.innerHTML=data.results?.length?data.results.map((gif,index)=>`<button type="button" data-gif-index="${index}" title="${safe(gif.title||"Choose GIF")}"><img src="${safe(gif.preview||gif.url)}" alt="${safe(gif.title||"GIF result")}" loading="lazy"></button>`).join(""):"<p>No GIFs found. Try another search.</p>";$$('[data-gif-index]',results).forEach(button=>button.onclick=()=>{const gif=data.results[Number(button.dataset.gifIndex)];pendingMedia=gif.url;mediaPreview(gif.preview||gif.url,gif.title||"GIPHY GIF");picker.remove();});}catch(error){results.innerHTML=`<p>${safe(error.message)}</p>`;}};$("#gif-search").onclick=search;$("#gif-query").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();search();}};$("#gif-query").focus();}

  $("#modal-close").onclick=closeModal;modal.onclick=e=>{if(e.target===modal)closeModal();};$("#gif-button").onclick=gifPicker;$("#media-input").addEventListener("change",e=>{if(previewUrl)URL.revokeObjectURL(previewUrl);const file=e.target.files[0];if(!file)return;previewUrl=URL.createObjectURL(file);mediaPreview(previewUrl,file.name);});composer.addEventListener("submit",()=>setTimeout(()=>{$("#composer-preview")?.remove();$("#gif-picker")?.remove();},300));document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(!modal.hidden)closeModal();else $("#gif-picker")?.remove();}});$$('[data-channel]').forEach(button=>button.addEventListener("click",()=>setTimeout(()=>{composerTool();ensurePlugin();},25)));new MutationObserver(ensurePlugin).observe(area,{childList:true});composerTool();ensurePlugin();
})();
