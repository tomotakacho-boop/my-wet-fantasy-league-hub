const POSITION = { 1: "QB", 2: "RB", 3: "WR", 4: "TE", 5: "K", 16: "D/ST" };

function projectedTotal(player, scoringPeriodId = 0) {
  const stat = (player.stats || []).find((item) =>
    item.seasonId === 2026 && item.statSourceId === 1 && item.statSplitTypeId === 0 && item.scoringPeriodId === scoringPeriodId
  );
  return Number(stat?.appliedTotal || 0);
}

export const handler = async () => {
  const leagueId = process.env.ESPN_LEAGUE_ID || "64665002";
  const season = process.env.ESPN_SEASON || "2026";
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}?view=mTeam&view=mRoster&view=mSettings&view=mMatchup`;
  try {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) return { statusCode: response.status, body: JSON.stringify({ error: "ESPN league request failed" }) };
    const raw = await response.json();
    const currentMatchupPeriod = raw.status?.currentMatchupPeriod || 1;
    const members = new Map((raw.members || []).map((member) => [member.id, [member.firstName, member.lastName].filter(Boolean).join(" ").replace(/\s+/g, " ").trim() || member.displayName]));
    const teams = (raw.teams || []).map((team) => {
      const record = team.record?.overall || {};
      return {
        id: team.id,
        name: team.name,
        abbreviation: team.abbrev,
        owner: members.get(team.owners?.[0]) || "League member",
        logo: team.logo || null,
        record: { wins: record.wins || 0, losses: record.losses || 0, ties: record.ties || 0, pointsFor: record.pointsFor || 0, pointsAgainst: record.pointsAgainst || 0 },
        roster: (team.roster?.entries || []).map((entry) => {
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
      homeScore: game.home?.totalPoints || 0,
      awayScore: game.away?.totalPoints || 0,
    }));
    return {
      statusCode: 200,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=300, s-maxage=300" },
      body: JSON.stringify({ name: raw.settings?.name || "My Wet Fantasy", season: raw.seasonId, currentMatchupPeriod, teams, schedule }),
    };
  } catch (error) {
    return { statusCode: 502, body: JSON.stringify({ error: "Unable to reach ESPN" }) };
  }
};
