(() => {
  const EMOJIS = ["👍", "❤️", "😂", "🔥", "🏈", "👀"];
  const EMOJI_CATALOG = [
    ["😀","grinning happy face","smileys"],["😃","happy smile face","smileys"],["😄","smiling eyes face","smileys"],["😁","beaming grin face","smileys"],["😆","laugh squint face","smileys"],["🥹","holding back tears face","smileys"],["😅","sweat smile face","smileys"],["😂","tears joy laugh face","smileys"],["🤣","rolling laugh face","smileys"],["🥲","smile tear face","smileys"],["😊","blush smile face","smileys"],["😇","halo angel face","smileys"],["🙂","slight smile face","smileys"],["🙃","upside down face","smileys"],["😉","wink face","smileys"],["😌","relieved face","smileys"],["😍","heart eyes love face","smileys"],["🥰","hearts love face","smileys"],["😘","kiss heart face","smileys"],["😋","delicious tongue face","smileys"],["😜","wink tongue face","smileys"],["🤪","zany silly face","smileys"],["🤨","raised eyebrow face","smileys"],["🧐","monocle face","smileys"],["🤓","nerd glasses face","smileys"],["😎","sunglasses cool face","smileys"],["🤩","star eyes excited face","smileys"],["🥳","party face","smileys"],["😏","smirk face","smileys"],["😒","unamused face","smileys"],["😔","pensive sad face","smileys"],["😞","disappointed face","smileys"],["🥺","pleading face","smileys"],["😢","cry face","smileys"],["😭","sob crying face","smileys"],["😤","triumph steam face","smileys"],["😡","angry face","smileys"],["🤬","swearing face","smileys"],["🤯","mind blown face","smileys"],["🥶","cold face","smileys"],["😱","scream face","smileys"],["🤔","thinking face","smileys"],["🫡","salute face","smileys"],["🤫","quiet shush face","smileys"],["🫠","melting face","smileys"],["💀","skull dead","smileys"],["🤡","clown face","smileys"],["💩","poop","smileys"],
    ["👍","thumbs up hand","people"],["👎","thumbs down hand","people"],["👏","clap hands","people"],["🙌","raised hands","people"],["🤝","handshake","people"],["🙏","pray thanks hands","people"],["💪","strong flex arm","people"],["🫶","heart hands","people"],["🤦","facepalm person","people"],["🤷","shrug person","people"],["👀","eyes look","people"],["🫵","pointing at you","people"],["✍️","writing hand","people"],["🖕","middle finger hand","people"],
    ["🐶","dog animal","animals"],["🐱","cat animal","animals"],["🐻","bear animal","animals"],["🐼","panda animal","animals"],["🦁","lion animal","animals"],["🐸","frog animal","animals"],["🐐","goat animal","animals"],["🦆","duck animal","animals"],["🦅","eagle animal","animals"],["🐍","snake animal","animals"],["🦖","dinosaur animal","animals"],["🐳","whale animal","animals"],
    ["🍎","apple fruit food","food"],["🍕","pizza food","food"],["🍔","burger food","food"],["🌮","taco food","food"],["🌭","hot dog food","food"],["🍗","chicken leg food","food"],["🍻","beer cheers drink","food"],["🥂","champagne cheers drink","food"],["☕","coffee drink","food"],["🎂","birthday cake food","food"],
    ["🏈","football sport","activity"],["🏆","trophy winner","activity"],["🥇","gold medal first","activity"],["🎯","target bullseye","activity"],["🎲","dice game","activity"],["🎉","party popper celebration","activity"],["🎊","confetti celebration","activity"],["💯","hundred perfect","activity"],["🔥","fire hot","activity"],["🚀","rocket launch","activity"],
    ["🚗","car travel","travel"],["✈️","airplane travel","travel"],["🏠","house home","travel"],["🏟️","stadium travel","travel"],["🌎","world globe","travel"],["⛈️","storm weather","travel"],["☀️","sun weather","travel"],["🌙","moon night","travel"],
    ["💡","light bulb idea","objects"],["💰","money bag","objects"],["💸","flying money","objects"],["📈","chart up","objects"],["📉","chart down","objects"],["🧹","broom sweep","objects"],["🗑️","trash can","objects"],["🔒","lock","objects"],["🔑","key","objects"],["📣","megaphone announcement","objects"],
    ["❤️","red heart love","symbols"],["💔","broken heart","symbols"],["💚","green heart","symbols"],["💙","blue heart","symbols"],["💜","purple heart","symbols"],["✅","check mark yes","symbols"],["❌","cross no","symbols"],["⚠️","warning","symbols"],["‼️","double exclamation","symbols"],["❓","question mark","symbols"],["⬆️","up arrow","symbols"],["⬇️","down arrow","symbols"]
  ].map(([emoji,keywords,category]) => ({emoji,keywords,category}));
  const CATEGORIES = [["smileys","😀"],["people","🫶"],["animals","🐶"],["food","🍎"],["activity","🏈"],["travel","🚗"],["objects","💡"],["symbols","❤️"]];
  const messageArea = document.querySelector("#message-area");
  const rankingList = document.querySelector("#ranking-list");
  const displayName = () => user?.user_metadata?.full_name || user?.email?.split("@")[0] || "League member";
  const avatarUrl = () => user?.user_metadata?.avatar_url || null;
  const time = value => new Date(value).toLocaleString([], { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" });
  let messageRows = [], messageReactions = [], activeMessageReply = null, activeMessagePicker = null, expandedMessagePicker = null;
  let rankingTeams = [], powerComments = [], powerReactions = [], activePowerReply = null, activePowerPicker = null, expandedPowerPicker = null, powerLoaded = false;

  function emojiBrowser(kind, id) {
    const idAttribute = kind === "power" ? `data-ranking-key="${esc(id)}" data-power-reaction` : `data-message-id="${id}" data-message-reaction`;
    return `<section class="emoji-browser" data-emoji-browser data-browser-kind="${kind}"><label class="emoji-search"><span>⌕</span><input autocomplete="off" placeholder="Search" aria-label="Search emojis"></label><div class="emoji-grid">${EMOJI_CATALOG.map(item => `<button type="button" ${idAttribute}="${item.emoji}" data-emoji-choice data-category="${item.category}" data-keywords="${esc(item.keywords)}" aria-label="${esc(item.keywords)}">${item.emoji}</button>`).join("")}</div><nav class="emoji-categories" aria-label="Emoji categories">${CATEGORIES.map(([category,icon]) => `<button type="button" data-emoji-category="${category}" aria-label="${category}">${icon}</button>`).join("")}</nav></section>`;
  }

  function attribution(rows) {
    const names = [...new Set(rows.map(row => row.display_name || row.author_name || "League member"))];
    return names.length <= 3 ? names.join(", ") : `${names.slice(0, 2).join(", ")} + ${names.length - 2} others`;
  }

  function reactionButtons(id, rows, kind) {
    return EMOJIS.map(emoji => {
      const matches = rows.filter(row => row.emoji === emoji);
      if (!matches.length) return "";
      const mine = matches.some(row => row.user_id === user?.id);
      const label = attribution(matches);
      const idAttribute = kind === "power" ? `data-ranking-key="${esc(id)}" data-power-reaction="${emoji}"` : `data-message-id="${id}" data-message-reaction="${emoji}"`;
      return `<button class="social-reaction ${mine ? "is-mine" : ""}" ${idAttribute} data-tooltip="${esc(label)}" aria-label="${mine ? "Remove" : "Add"} ${emoji} reaction. ${esc(label)}">${emoji} ${matches.length}</button>`;
    }).join("");
  }

  function threadMarkup(parentId) {
    const replies = messageRows.filter(row => row.parent_id === parentId);
    if (!replies.length) return "";
    return `<div class="message-thread">${replies.map(reply => `<div class="thread-reply"><span class="thread-avatar">${initials(reply.author_name)}</span><div><strong>${esc(reply.author_name)}</strong><time>${time(reply.created_at)}</time><p>${esc(reply.content || "")}</p>${reply.media_url ? `<img class="message-media" src="${esc(reply.media_url)}" alt="Shared reply media">` : ""}</div></div>`).join("")}</div>`;
  }

  function messageMarkup(message) {
    const rows = messageReactions.filter(row => row.message_id === message.id);
    const buttons = reactionButtons(message.id, rows, "message");
    const pickerOpen = activeMessagePicker === message.id;
    const replyOpen = activeMessageReply === message.id;
    return `<article class="feed-message" data-message-card="${message.id}">
      <div class="avatar-placeholder">${initials(message.author_name)}</div>
      <div class="message-body"><div><strong>${esc(message.author_name)}</strong><time>${time(message.created_at)}</time></div><p>${esc(message.content || "")}</p>${message.media_url ? `<img class="message-media" src="${esc(message.media_url)}" alt="Shared media">` : ""}
        ${buttons ? `<div class="reaction-row">${buttons}</div>` : ""}
        <div class="message-hover-actions"><button type="button" data-add-message-reaction="${message.id}" aria-label="Add reaction"><span class="reaction-face">☺</span><span class="reaction-plus">+</span></button><button type="button" data-reply-message="${message.id}" aria-label="Reply">↩</button></div>
        ${pickerOpen ? `<div class="reaction-picker" role="group" aria-label="Choose a reaction">${EMOJIS.map(emoji => `<button type="button" data-message-id="${message.id}" data-message-reaction="${emoji}" aria-label="React ${emoji}">${emoji}</button>`).join("")}<button type="button" data-open-message-browser="${message.id}" class="emoji-more" aria-label="More emojis">›</button><button type="button" data-close-message-picker aria-label="Close">×</button></div>` : ""}
        ${expandedMessagePicker === message.id ? emojiBrowser("message", message.id) : ""}
        ${threadMarkup(message.id)}
        ${replyOpen ? `<form class="inline-reply-form" data-message-reply-form="${message.id}"><input maxlength="500" placeholder="Reply to ${esc(message.author_name)}" aria-label="Reply to ${esc(message.author_name)}" required><button type="submit">Reply</button><button type="button" data-cancel-message-reply>Cancel</button></form>` : ""}
      </div></article>`;
  }

  renderMessages = (messages, reactions) => {
    messageRows = messages;
    messageReactions = reactions;
    const roots = messages.filter(message => !message.parent_id || !messages.some(parent => parent.id === message.parent_id));
    messageArea.innerHTML = `<div class="feed-welcome compact-welcome"><span>#</span><h1>#${esc(channel)}</h1><p>${esc(CHANNELS[channel])}</p></div>${roots.map(messageMarkup).join("") || '<div class="empty-state feed-empty">No messages yet. Start the channel.</div>'}`;
  };

  loadMessages = async () => {
    if (!db || !user) return feedWelcome();
    const result = await db.from("messages").select("*").eq("channel", channel).order("created_at", { ascending:true }).limit(200);
    if (result.error) return feedWelcome();
    const ids = result.data.map(message => message.id);
    let reactions = [];
    if (ids.length) reactions = (await db.from("message_reactions").select("message_id,user_id,emoji,display_name").in("message_id", ids)).data || [];
    renderMessages(result.data, reactions);
  };

  async function toggleMessageReaction(messageId, emoji) {
    if (!user) return toast("Sign in with Google to react.");
    const existing = messageReactions.find(row => row.message_id === messageId && row.user_id === user.id && row.emoji === emoji);
    const result = existing
      ? await db.from("message_reactions").delete().eq("message_id", messageId).eq("user_id", user.id).eq("emoji", emoji)
      : await db.from("message_reactions").insert({ message_id:messageId, user_id:user.id, emoji, display_name:displayName() });
    if (result.error) toast(result.error.message);
    else { activeMessagePicker = null; expandedMessagePicker = null; await loadMessages(); }
  }

  messageArea.addEventListener("click", async event => {
    const add = event.target.closest("[data-add-message-reaction]");
    const more = event.target.closest("[data-open-message-browser]");
    const reaction = event.target.closest("[data-message-reaction]");
    const reply = event.target.closest("[data-reply-message]");
    if (add) {
      if (!user) return toast("Sign in with Google to react.");
      const id = add.dataset.addMessageReaction; activeMessagePicker = activeMessagePicker === id ? null : id; activeMessageReply = null; renderMessages(messageRows, messageReactions); return;
    }
    if (more) { expandedMessagePicker = more.dataset.openMessageBrowser; activeMessagePicker = null; renderMessages(messageRows, messageReactions); return; }
    if (reaction) return toggleMessageReaction(reaction.dataset.messageId, reaction.dataset.messageReaction);
    if (reply) {
      if (!user) return toast("Sign in with Google to reply.");
      const id = reply.dataset.replyMessage; activeMessageReply = activeMessageReply === id ? null : id; activeMessagePicker = null; renderMessages(messageRows, messageReactions); document.querySelector(`[data-message-reply-form="${id}"] input`)?.focus(); return;
    }
    if (event.target.closest("[data-close-message-picker]")) { activeMessagePicker = null; expandedMessagePicker = null; renderMessages(messageRows, messageReactions); }
    if (event.target.closest("[data-cancel-message-reply]")) { activeMessageReply = null; renderMessages(messageRows, messageReactions); }
  });

  messageArea.addEventListener("submit", async event => {
    const form = event.target.closest("[data-message-reply-form]");
    if (!form) return;
    event.preventDefault();
    const body = form.querySelector("input").value.trim();
    if (!body || !user) return;
    const result = await db.from("messages").insert({ channel, user_id:user.id, author_name:displayName(), content:body, parent_id:form.dataset.messageReplyForm });
    if (result.error) toast(result.error.message);
    else { activeMessageReply = null; await loadMessages(); }
  });

  const baseRenderRankings = renderRankings;
  renderRankings = teams => {
    rankingTeams = teams;
    baseRenderRankings(teams);
    const ordered = rankings(teams);
    document.querySelectorAll(".ranking-card").forEach((card, index) => {
      const row = ordered[index];
      if (!row) return;
      const key = `week-0-team-${row.team.id}`;
      card.dataset.rankingKey = key;
      const comments = powerComments.filter(comment => comment.ranking_key === key);
      const reactions = powerReactions.filter(reaction => reaction.ranking_key === key);
      const buttons = reactionButtons(key, reactions, "power");
      const social = document.createElement("div");
      social.className = "ranking-social";
      social.innerHTML = `<div class="ranking-social-bar">${buttons ? `<div class="power-re-row">${buttons}</div>` : '<span class="no-reactions">No reactions yet</span>'}<button type="button" class="ranking-action" data-add-power-reaction="${key}">☺＋ Add reaction</button><button type="button" class="ranking-action" data-power-reply="${key}">↩ Reply${comments.length ? ` (${comments.length})` : ""}</button></div>
        ${activePowerPicker === key ? `<div class="power-reaction-picker" role="group" aria-label="Choose a reaction">${EMOJIS.map(emoji => `<button type="button" data-ranking-key="${key}" data-power-reaction="${emoji}">${emoji}</button>`).join("")}<button type="button" data-open-power-browser="${key}" class="emoji-more" aria-label="More emojis">›</button><button type="button" data-close-power-picker>×</button></div>` : ""}
        ${expandedPowerPicker === key ? emojiBrowser("power", key) : ""}
        ${comments.length ? `<div class="power-thread">${comments.map(comment => `<div class="power-comment">${comment.author_avatar ? `<img src="${esc(comment.author_avatar)}" alt="">` : `<span>${initials(comment.author_name)}</span>`}<div><strong>${esc(comment.author_name)}</strong><p>${esc(comment.body)}</p><small>${time(comment.created_at)}</small></div></div>`).join("")}</div>` : ""}
        ${activePowerReply === key ? `<form class="power-reply-form" data-power-reply-form="${key}"><input maxlength="500" placeholder="Reply to this ranking" required><button type="submit">Reply</button><button type="button" data-cancel-power-reply>Cancel</button></form>` : ""}`;
      card.append(social);
    });
  };

  async function loadPowerActivity(silent = false) {
    if (!db || !user || !rankingTeams.length) { powerComments = []; powerReactions = []; if (rankingTeams.length) renderRankings(rankingTeams); return; }
    const keys = rankings(rankingTeams).map(row => `week-0-team-${row.team.id}`);
    const [commentsResult, reactionsResult] = await Promise.all([
      db.from("power_ranking_comments").select("*").in("ranking_key", keys).order("created_at", {ascending:true}),
      db.from("power_ranking_reactions").select("*").in("ranking_key", keys)
    ]);
    if (commentsResult.error || reactionsResult.error) {
      powerLoaded = false;
      if (!silent) toast("Run the updated Supabase setup to enable ranking reactions and replies.");
    } else { powerComments = commentsResult.data || []; powerReactions = reactionsResult.data || []; powerLoaded = true; }
    renderRankings(rankingTeams);
  }

  rankingList.addEventListener("click", async event => {
    const add = event.target.closest("[data-add-power-reaction]"), reaction = event.target.closest("[data-power-reaction]"), reply = event.target.closest("[data-power-reply]"), more = event.target.closest("[data-open-power-browser]");
    if (add) { if (!user) return toast("Sign in with Google to react."); const key=add.dataset.addPowerReaction;activePowerPicker=activePowerPicker===key?null:key;activePowerReply=null;renderRankings(rankingTeams);return; }
    if (more) { expandedPowerPicker=more.dataset.openPowerBrowser;activePowerPicker=null;renderRankings(rankingTeams);return; }
    if (reaction) {
      if (!user) return toast("Sign in with Google to react.");
      const key=reaction.dataset.rankingKey,emoji=reaction.dataset.powerReaction,existing=powerReactions.find(row=>row.ranking_key===key&&row.user_id===user.id&&row.emoji===emoji);
      const result=existing?await db.from("power_ranking_reactions").delete().eq("id",existing.id):await db.from("power_ranking_reactions").insert({ranking_key:key,user_id:user.id,emoji,display_name:displayName()});
      if(result.error)toast(result.error.message);else{activePowerPicker=null;expandedPowerPicker=null;await loadPowerActivity(true);}return;
    }
    if (reply) { if(!user)return toast("Sign in with Google to reply.");const key=reply.dataset.powerReply;activePowerReply=activePowerReply===key?null:key;activePowerPicker=null;renderRankings(rankingTeams);document.querySelector(`[data-power-reply-form="${key}"] input`)?.focus();return; }
    if(event.target.closest("[data-close-power-picker]")){activePowerPicker=null;expandedPowerPicker=null;renderRankings(rankingTeams);}
    if(event.target.closest("[data-cancel-power-reply]")){activePowerReply=null;renderRankings(rankingTeams);}
  });

  rankingList.addEventListener("submit", async event => {
    const form=event.target.closest("[data-power-reply-form]");if(!form)return;event.preventDefault();const body=form.querySelector("input").value.trim();if(!body||!user)return;
    const result=await db.from("power_ranking_comments").insert({ranking_key:form.dataset.powerReplyForm,user_id:user.id,author_name:displayName(),author_avatar:avatarUrl(),body});
    if(result.error)toast(result.error.message);else{activePowerReply=null;await loadPowerActivity(true);}
  });

  function filterEmojiBrowser(browser, category = null) {
    const query = browser.querySelector(".emoji-search input").value.trim().toLowerCase();
    browser.querySelectorAll("[data-emoji-choice]").forEach(button => {
      const categoryMatch = !category || button.dataset.category === category;
      const searchMatch = !query || button.dataset.keywords.includes(query) || button.textContent.includes(query);
      button.hidden = !(categoryMatch && searchMatch);
    });
    browser.querySelectorAll("[data-emoji-category]").forEach(button => button.classList.toggle("is-active", button.dataset.emojiCategory === category));
  }
  [messageArea,rankingList].forEach(root => {
    root.addEventListener("input", event => { const browser=event.target.closest("[data-emoji-browser]");if(browser)filterEmojiBrowser(browser); });
    root.addEventListener("click", event => { const category=event.target.closest("[data-emoji-category]");if(!category)return;const browser=category.closest("[data-emoji-browser]");browser.querySelector(".emoji-search input").value="";filterEmojiBrowser(browser,category.dataset.emojiCategory); });
  });

  document.addEventListener("click", event => {
    if (event.target.closest(".emoji-browser,[data-open-message-browser],[data-open-power-browser],[data-add-message-reaction],[data-add-power-reaction]")) return;
    if (expandedMessagePicker) { expandedMessagePicker=null;renderMessages(messageRows,messageReactions); }
    if (expandedPowerPicker) { expandedPowerPicker=null;renderRankings(rankingTeams); }
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (expandedMessagePicker) { expandedMessagePicker=null;renderMessages(messageRows,messageReactions); }
    if (expandedPowerPicker) { expandedPowerPicker=null;renderRankings(rankingTeams); }
  });

  document.querySelector('[data-view="power"]')?.addEventListener("click",()=>setTimeout(()=>loadPowerActivity(true),50));
  new MutationObserver(() => { if(user && !powerLoaded) loadPowerActivity(true); }).observe(document.querySelector("#auth-button"), {attributes:true,attributeFilter:["class"]});
  setTimeout(() => { if(user) { loadMessages(); loadPowerActivity(true); } }, 800);
})();
