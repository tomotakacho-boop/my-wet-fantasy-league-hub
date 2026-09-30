(() => {
  const weekly = p => Number(p.weeklyProjection || 0) || Number(p.seasonProjection || 0) / 17;
  const average = values => values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
  const injuryWeight = status => ({ ACTIVE: 0, QUESTIONABLE: .25, DOUBTFUL: .7, OUT: 1, INJURY_RESERVE: 1, IR: 1, SUSPENSION: 1 }[status] ?? .1);
  const cv = position => ({ QB: .2, RB: .34, WR: .39, TE: .36, "D/ST": .42, K: .32 }[position] || .35);
  const optimize = team => {
    const pool = [...(team.roster || [])].sort((a, b) => weekly(b) - weekly(a)), used = new Set();
    const grab = (position, count) => pool.filter(p => p.position === position && !used.has(p.id)).slice(0, count).map(p => (used.add(p.id), p));
    const starters = [...grab("QB", 1), ...grab("RB", 1), ...grab("WR", 1), ...grab("TE", 1), ...grab("D/ST", 1), ...grab("K", 1)];
    const flex = pool.filter(p => ["RB", "WR", "TE"].includes(p.position) && !used.has(p.id)).slice(0, 3);
    flex.forEach(p => used.add(p.id)); starters.push(...flex);
    const skill = pool.filter(p => ["RB", "WR", "TE"].includes(p.position));
    const bench = skill.filter(p => !used.has(p.id)).slice(0, 3);
    const stars = skill.slice(0, 3);
    const wildcardPool = pool.filter(p => !used.has(p.id) && ["RB", "WR", "TE"].includes(p.position));
    const wildcard = wildcardPool.sort((a, b) => (weekly(b) * (1 - Math.min(Number(b.percentOwned || 0), 100) / 125)) - (weekly(a) * (1 - Math.min(Number(a.percentOwned || 0), 100) / 125)))[0];
    const lineup = starters.reduce((s, p) => s + weekly(p), 0);
    const starPower = stars.reduce((s, p) => s + weekly(p), 0);
    const depth = bench.reduce((s, p) => s + weekly(p), 0);
    const injuryRisk = starters.reduce((s, p) => s + weekly(p) * injuryWeight(p.injuryStatus), 0);
    const wildcardValue = wildcard ? weekly(wildcard) * (1 - Math.min(Number(wildcard.percentOwned || 0), 100) / 125) : 0;
    const rawSd = Math.sqrt(starters.reduce((s, p) => s + Math.pow(weekly(p) * cv(p.position), 2), 0));
    return { team, starters, stars, bench, wildcard, lineup, starPower, depth, injuryRisk, health: Math.max(1, lineup - injuryRisk), wildcardValue, rawSd };
  };
  rankings = teams => {
    const rows = teams.map(optimize), leagueStarPower = average(rows.map(x => x.starPower)), leagueDepth = average(rows.map(x => x.depth));
    rows.forEach(x => {
      const starScenario = x.lineup + .35 * (x.starPower - leagueStarPower);
      const depthScenario = x.lineup + .15 * (x.depth - leagueDepth);
      const injuryScenario = x.lineup - x.injuryRisk;
      const wildcardScenario = x.lineup + .5 * x.wildcardValue;
      x.projected = .55 * x.lineup + .25 * starScenario + .05 * depthScenario + .05 * injuryScenario + .10 * wildcardScenario;
      x.projected = Math.max(0, x.projected);
      x.stdDev = Math.max(6, Math.min(22, x.rawSd * (x.projected / Math.max(x.lineup, 1)) + x.injuryRisk * .2));
      x.recentScore = Number(x.team.recentScore || 0);
      const record = x.team.record || { wins: 0, losses: 0, ties: 0, pointsFor: 0 };
      x.gamesPlayed = Math.max(1, Number(record.wins || 0) + Number(record.losses || 0) + Number(record.ties || 0));
      x.pointsFor = Number(record.pointsFor || 0);
      x.pointsPerGame = x.pointsFor / x.gamesPlayed;
      x.powerScore = league?.lastCompletedWeek && x.recentScore ? .6 * x.projected + .25 * x.recentScore + .15 * x.pointsPerGame : x.projected;
    });
    return rows.sort((a, b) => b.powerScore - a.powerScore);
  };
  renderRankings = teams => {
    const ordered = rankings(teams), leagueAverage = average(ordered.map(x => x.powerScore)), averageEl = document.querySelector("#projected-league-average"), completed = league?.lastCompletedWeek || 0, next = league?.currentMatchupPeriod || 1;
    if (averageEl) averageEl.textContent = leagueAverage.toFixed(1);
    document.querySelector("#power-period").textContent = completed ? `AFTER WEEK ${completed}` : "PRESEASON";
    document.querySelector("#power-summary").textContent = completed ? `Power score blends the Week ${next} forecast (60%), Week ${completed} score (25%), and season points per game (15%). The ± figure shows forecast volatility.` : "Rankings use ESPN’s projected score for each team’s best legal lineup. The ± figure shows expected week-to-week volatility.";
    document.querySelector("#power-section-heading").textContent = completed ? `Week ${completed} power rankings` : "Preseason rankings";
    document.querySelector("#power-section-note").textContent = completed ? `Week ${completed} results and Week ${next} ESPN projections.` : "Scores update when ESPN projections change.";
    document.querySelector("#power-average-label").textContent = completed ? "AVG POWER SCORE" : "LEAGUE AVG";
    document.querySelector("#power-average-unit").textContent = completed ? "BLENDED POINTS" : "PROJECTED POINTS";
    document.querySelector("#ranking-list").innerHTML = ordered.map((x, i) => {
      const leaders = x.stars.map(p => p.fullName).join(", ") || "Projection data pending";
      const injury = x.injuryRisk > 1 ? ` Injury uncertainty removes about ${x.injuryRisk.toFixed(1)} raw lineup points.` : " The current starting group carries limited injury drag.";
      const wild = x.wildcard ? `${x.wildcard.fullName} is the model’s wildcard.` : "The wildcard slot is still open.";
      const tags = [`Lineup ${x.lineup.toFixed(1)}`, `Stars ${x.starPower.toFixed(1)}`, `PF/game ${x.pointsPerGame.toFixed(1)}`, `Depth ${x.depth.toFixed(1)}`, `Injury risk −${x.injuryRisk.toFixed(1)}`, `Wildcard ${x.wildcardValue.toFixed(1)}`].map(v => `<span>${esc(v)}</span>`).join("");
      const record = x.team.record || {wins:0,losses:0,ties:0}, scoreLabel = completed ? "POWER SCORE" : "PROJECTED POINTS";
      const recap = completed ? `Week ${completed}: ${x.recentScore.toFixed(2)} points. Week ${next} forecast: ${x.projected.toFixed(1)}. Season PF/game: ${x.pointsPerGame.toFixed(1)}.` : `Week ${next} forecast: ${x.projected.toFixed(1)} points.`;
      return `<article class="ranking-card"><div class="rank-number">${i + 1}</div><div class="rank-copy"><small>${record.wins}–${record.losses}${record.ties?`–${record.ties}`:""} · ${esc(x.team.owner)}</small><h3>${esc(x.team.name)}</h3><p><strong>${esc(recap)}</strong> ${esc(leaders)} anchor the projected lineup.${esc(injury)} ${esc(wild)}</p><div class="player-tags factor-tags">${tags}</div></div><div class="rank-score"><strong>${x.powerScore.toFixed(1)}</strong><small>${scoreLabel}</small><em>± ${x.stdDev.toFixed(1)}</em><small>FORECAST STD DEV</small></div></article>`;
    }).join("");
  };
})();
