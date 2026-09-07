const pendingTeams = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: `Team ${String(index + 1).padStart(2, "0")}`,
}));

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function teamRows(teams) {
  return teams.map((team, index) => `
    <div class="standing-row">
      <span>${index + 1}</span>
      <div class="team-cell"><i>${String(team.id).padStart(2, "0")}</i><span><strong>${team.name}</strong><small>Owner pending</small></span></div>
      <span>0–0–0</span><span>0.0</span>
    </div>`).join("");
}

function renderTemplateData() {
  $("#division-one").innerHTML = teamRows(pendingTeams.slice(0, 6));
  $("#division-two").innerHTML = teamRows(pendingTeams.slice(6));
  $("#matchup-list").innerHTML = Array.from({ length: 6 }, (_, index) => `
    <div class="matchup"><span>${pendingTeams[index].name}</span><span>VS</span><span>${pendingTeams[11 - index].name}</span></div>`).join("");
  $("#ranking-list").innerHTML = pendingTeams.map((team, index) => `
    <article class="ranking-card"><div class="rank-number">${index + 1}</div><div class="rank-copy"><small>TEAM AND RECORD PENDING</small><h3>${team.name}</h3><p>Weekly power-ranking analysis will appear here.</p></div><div class="rank-score">—</div></article>`).join("");
  $("#member-list").innerHTML = pendingTeams.map((team) => `<div class="member"><i>${String(team.id).padStart(2, "0")}</i><span><strong>${team.name}</strong><small>Owner pending</small></span></div>`).join("");
}

function switchView(view, updateHash = true) {
  $$("[data-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
  $$("[data-view-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.viewPanel === view));
  if (updateHash) history.replaceState(null, "", `#${view}`);
  window.scrollTo({ top: 0, behavior: "instant" });
}

$$("[data-view]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
window.addEventListener("hashchange", () => {
  const view = location.hash.slice(1);
  if (["overview", "power", "methods", "feed"].includes(view)) switchView(view, false);
});

renderTemplateData();
const initialView = location.hash.slice(1);
if (["overview", "power", "methods", "feed"].includes(initialView)) switchView(initialView, false);
