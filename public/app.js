const leagueTeams = [
  { id: 1, name: "Child's Play (LIAN)", owner: "Charles Lian" },
  { id: 2, name: "Unc Central (BOX)", owner: "Shaurya Baxi" },
  { id: 3, name: "Crooklyn L Train (NoLM)", owner: "Shrikar Kundur" },
  { id: 4, name: "AI-YAI-YUK WE'RE WORTH(Y)LESS (UI4L)", owner: "Kevin Wong" },
  { id: 5, name: "Bunda Bandits (BLÜD)", owner: "Vikram Ashok" },
  { id: 6, name: "Staten Island Dumptruck (SID)", owner: "Nikhil Glese" },
  { id: 7, name: "Cooking Lamb In Packerstan 🥾 (MOSS)", owner: "Randy Lai" },
  { id: 8, name: "🅱️ASTARD ✓", owner: "Gyan Kandhari" },
  { id: 9, name: "New York Squib Cakes (SAm)", owner: "Sameer Goyal" },
  { id: 10, name: "Lowry's Dumpy (THIC)", owner: "Soham Kamat" },
  { id: 11, name: "Mala Party (MRTY)", owner: "Sahisnu Malapati" },
  { id: 12, name: "McConkey Kong (AM)", owner: "Andrew Magee" },
  { id: 13, name: "Nactuaa spit on that thang (ULOS)", owner: "Phil Tereshenko" },
  { id: 14, name: "Cho Consulting Group", owner: "Tomotaka Cho" },
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function teamRows(teams) {
  return teams.map((team, index) => `
    <div class="standing-row">
      <span>${index + 1}</span>
      <div class="team-cell"><i>${team.name.split(/\s+/).map((word) => word[0]).join("").replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase()}</i><span><strong>${team.name}</strong><small>${team.owner}</small></span></div>
      <span>0–0–0</span><span>0.0</span>
    </div>`).join("");
}

function renderTemplateData() {
  $("#league-standings").innerHTML = teamRows(leagueTeams);
  $("#matchup-list").innerHTML = Array.from({ length: 7 }, (_, index) => `
    <div class="matchup"><span>${leagueTeams[index].name}</span><span>VS</span><span>${leagueTeams[13 - index].name}</span></div>`).join("");
  $("#ranking-list").innerHTML = leagueTeams.map((team, index) => `
    <article class="ranking-card"><div class="rank-number">${index + 1}</div><div class="rank-copy"><small>PRESEASON · ${team.owner}</small><h3>${team.name}</h3><p>Weekly power-ranking analysis will appear here after the ESPN roster sync.</p></div><div class="rank-score">—</div></article>`).join("");
  $("#member-list").innerHTML = leagueTeams.map((team) => `<div class="member"><i>${team.name.split(/\s+/).map((word) => word[0]).join("").replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase()}</i><span><strong>${team.name}</strong><small>${team.owner}</small></span></div>`).join("");
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
