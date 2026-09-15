const POSITION = { 1: "QB", 2: "RB", 3: "WR", 4: "TE", 5: "K", 16: "D/ST" };

function projectedTotal(player, scoringPeriodId = 0) {
  const stat = (player.stats || []).find((item) =>
    item.seasonId === 2026 && item.statSourceId === 1 && item.statSplitTypeId === (scoringPeriodId ? 1 : 0) && item.scoringPeriodId === scoringPeriodId
  );
  return Number(stat?.appliedTotal || 0);
}

function matchupScore(side, week) {
  return Number(side?.totalPoints || side?.totalPointsLive || side?.pointsByScoringPeriod?.[week] || 0);
}

export const handler = async () => {
  const leagueId = process.env.ESPN_LEAGUE_ID || "64665002";
  const season = process.env.ESPN_SEASON || "2026";
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}?view=mTeam&view=mRoster&view=mSettings&view=mMatchup&view=mScoreboard`;
  try {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) return { statusCode: response.status, body: JSON.stringify({ error: "ESPN league request failed" }) };
    const raw = await response.json();
    const weekOneGames = (raw.schedule || []).filter((game) => game.matchupPeriodId === 1 && game.home?.teamId && game.away?.teamId);
    // ESPN has Week 1 scores before it posts totalPoints, winner, and overall records.
    const weekOneFinal = season === "2026" && Date.now() >= Date.parse("2026-09-15T04:00:00Z") &&
      weekOneGames.length === 7 && weekOneGames.every((game) => matchupScore(game.home, 1) > 0 && matchupScore(game.away, 1) > 0);
    const espnPreviousWeek = Math.max(0, (raw.status?.currentMatchupPeriod || 1) - 1);
    const previousGames = (raw.schedule || []).filter((game) => game.matchupPeriodId === espnPreviousWeek && game.home?.teamId && game.away?.teamId);
    const previousWeekScored = previousGames.length === 7 && previousGames.every((game) => matchupScore(game.home, espnPreviousWeek) > 0 && matchupScore(game.away, espnPreviousWeek) > 0);
    const lastCompletedWeek = previousWeekScored ? espnPreviousWeek : (weekOneFinal ? 1 : 0);
    const currentMatchupPeriod = Math.max(raw.status?.currentMatchupPeriod || 1, lastCompletedWeek + 1);
    let rosterTeams = raw.teams || [];
    if (lastCompletedWeek) {
      const rosterResponse = await fetch(`${url}&scoringPeriodId=${currentMatchupPeriod}`, { headers: { accept: "application/json" } });
      if (rosterResponse.ok) rosterTeams = (await rosterResponse.json()).teams || rosterTeams;
    }
    const rosterById = new Map(rosterTeams.map((team) => [team.id, team.roster?.entries || []]));
    const scoredById = new Map();
    const completedGames = lastCompletedWeek === 1 ? weekOneGames : previousGames;
    if (lastCompletedWeek) completedGames.forEach((game) => {
      const homeScore = matchupScore(game.home, lastCompletedWeek), awayScore = matchupScore(game.away, lastCompletedWeek);
      scoredById.set(game.home.teamId, { pointsFor: homeScore, pointsAgainst: awayScore, wins: +(homeScore > awayScore), losses: +(homeScore < awayScore), ties: +(homeScore === awayScore) });
      scoredById.set(game.away.teamId, { pointsFor: awayScore, pointsAgainst: homeScore, wins: +(awayScore > homeScore), losses: +(awayScore < homeScore), ties: +(homeScore === awayScore) });
    });
    const members = new Map((raw.members || []).map((member) => [member.id, [member.firstName, member.lastName].filter(Boolean).join(" ").replace(/\s+/g, " ").trim() || member.displayName]));
    const teams = (raw.teams || []).map((team) => {
      const official = team.record?.overall || {};
      const record = (official.wins || 0) + (official.losses || 0) + (official.ties || 0) > 0 ? official : (scoredById.get(team.id) || official);
      return {
        id: team.id,
        name: team.name,
        abbreviation: team.abbrev,
        owner: members.get(team.owners?.[0]) || "League member",
        logo: team.logo || null,
        record: { wins: record.wins || 0, losses: record.losses || 0, ties: record.ties || 0, pointsFor: record.pointsFor || 0, pointsAgainst: record.pointsAgainst || 0 },
        recentScore: scoredById.get(team.id)?.pointsFor || null,
        roster: (rosterById.get(team.id) || []).map((entry) => {
          const player = entry.playerPoolEntry?.player || {};
          return {
            id: player.id,
            fullName: player.fullName,
            position: POSITION[player.defaultPositionId] || "OTHER",
            proTeamId: player.proTeamId,
            lineupSlotId: entry.lineupSlotId,
            injuryStatus: player.injuryStatus || "ACTIVE",
            seasonProjection: projectedTotal(player),
            weeklyProjection: projectedTotal(player, currentMatchupPeriod) || projectedTotal(player) / 17,
            percentOwned: Number(player.ownership?.percentOwned || 0),
          };
        }),
      };
    });
    const schedule = (raw.schedule || []).map((game) => ({
      id: game.id,
      matchupPeriodId: game.matchupPeriodId,
      homeTeamId: game.home?.teamId || null,
      awayTeamId: game.away?.teamId || null,
      homeScore: matchupScore(game.home, game.matchupPeriodId),
      awayScore: matchupScore(game.away, game.matchupPeriodId),
      final: Boolean((game.matchupPeriodId === 1 && weekOneFinal) || (game.winner && game.winner !== "UNDECIDED") || (game.matchupPeriodId === espnPreviousWeek && previousWeekScored)),
    }));
    return {
      statusCode: 200,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=300, s-maxage=300" },
      body: JSON.stringify({ name: raw.settings?.name || "My Wet Fantasy", season: raw.seasonId, currentMatchupPeriod, lastCompletedWeek, teams, schedule }),
    };
  } catch (error) {
    return { statusCode: 502, body: JSON.stringify({ error: "Unable to reach ESPN" }) };
  }
};
