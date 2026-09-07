(() => {
  const EMOJIS = ["👍", "❤️", "😂", "🔥", "🏈", "👀"];
  const messageArea = document.querySelector("#message-area");
  const rankingList = document.querySelector("#ranking-list");
  const displayName = () => user?.user_metadata?.full_name || user?.email?.split("@")[0] || "League member";
  const avatarUrl = () => user?.user_metadata?.avatar_url || null;
  const time = value => new Date(value).toLocaleString([], { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" });
  let messageRows = [], messageReactions = [], activeMessageReply = null, activeMessagePicker = null;
  let rankingTeams = [], powerComments = [], powerReactions = [], activePowerReply = null, activePowerPicker = null, powerLoaded = false;

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
        <div class="message-hover-actions"><button type="button" data-add-message-reaction="${message.id}" aria-label="Add reaction">☺＋</button><button type="button" data-reply-message="${message.id}" aria-label="Reply">↩</button></div>
        ${pickerOpen ? `<div class="reaction-picker" role="group" aria-label="Choose a reaction">${EMOJIS.map(emoji => `<button type="button" data-message-id="${message.id}" data-message-reaction="${emoji}" aria-label="React ${emoji}">${emoji}</button>`).join("")}<button type="button" data-close-message-picker aria-label="Close">×</button></div>` : ""}
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
    else { activeMessagePicker = null; await loadMessages(); }
  }

  messageArea.addEventListener("click", async event => {
    const add = event.target.closest("[data-add-message-reaction]");
    const reaction = event.target.closest("[data-message-reaction]");
    const reply = event.target.closest("[data-reply-message]");
    if (add) {
      if (!user) return toast("Sign in with Google to react.");
      const id = add.dataset.addMessageReaction; activeMessagePicker = activeMessagePicker === id ? null : id; activeMessageReply = null; renderMessages(messageRows, messageReactions); return;
    }
    if (reaction) return toggleMessageReaction(reaction.dataset.messageId, reaction.dataset.messageReaction);
    if (reply) {
      if (!user) return toast("Sign in with Google to reply.");
      const id = reply.dataset.replyMessage; activeMessageReply = activeMessageReply === id ? null : id; activeMessagePicker = null; renderMessages(messageRows, messageReactions); document.querySelector(`[data-message-reply-form="${id}"] input`)?.focus(); return;
    }
    if (event.target.closest("[data-close-message-picker]")) { activeMessagePicker = null; renderMessages(messageRows, messageReactions); }
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
        ${activePowerPicker === key ? `<div class="power-reaction-picker" role="group" aria-label="Choose a reaction">${EMOJIS.map(emoji => `<button type="button" data-ranking-key="${key}" data-power-reaction="${emoji}">${emoji}</button>`).join("")}<button type="button" data-close-power-picker>×</button></div>` : ""}
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
    const add = event.target.closest("[data-add-power-reaction]"), reaction = event.target.closest("[data-power-reaction]"), reply = event.target.closest("[data-power-reply]");
    if (add) { if (!user) return toast("Sign in with Google to react."); const key=add.dataset.addPowerReaction;activePowerPicker=activePowerPicker===key?null:key;activePowerReply=null;renderRankings(rankingTeams);return; }
    if (reaction) {
      if (!user) return toast("Sign in with Google to react.");
      const key=reaction.dataset.rankingKey,emoji=reaction.dataset.powerReaction,existing=powerReactions.find(row=>row.ranking_key===key&&row.user_id===user.id&&row.emoji===emoji);
      const result=existing?await db.from("power_ranking_reactions").delete().eq("id",existing.id):await db.from("power_ranking_reactions").insert({ranking_key:key,user_id:user.id,emoji,display_name:displayName()});
      if(result.error)toast(result.error.message);else{activePowerPicker=null;await loadPowerActivity(true);}return;
    }
    if (reply) { if(!user)return toast("Sign in with Google to reply.");const key=reply.dataset.powerReply;activePowerReply=activePowerReply===key?null:key;activePowerPicker=null;renderRankings(rankingTeams);document.querySelector(`[data-power-reply-form="${key}"] input`)?.focus();return; }
    if(event.target.closest("[data-close-power-picker]")){activePowerPicker=null;renderRankings(rankingTeams);}
    if(event.target.closest("[data-cancel-power-reply]")){activePowerReply=null;renderRankings(rankingTeams);}
  });

  rankingList.addEventListener("submit", async event => {
    const form=event.target.closest("[data-power-reply-form]");if(!form)return;event.preventDefault();const body=form.querySelector("input").value.trim();if(!body||!user)return;
    const result=await db.from("power_ranking_comments").insert({ranking_key:form.dataset.powerReplyForm,user_id:user.id,author_name:displayName(),author_avatar:avatarUrl(),body});
    if(result.error)toast(result.error.message);else{activePowerReply=null;await loadPowerActivity(true);}
  });

  document.querySelector('[data-view="power"]')?.addEventListener("click",()=>setTimeout(()=>loadPowerActivity(true),50));
  new MutationObserver(() => { if(user && !powerLoaded) loadPowerActivity(true); }).observe(document.querySelector("#auth-button"), {attributes:true,attributeFilter:["class"]});
  setTimeout(() => { if(user) { loadMessages(); loadPowerActivity(true); } }, 800);
})();
