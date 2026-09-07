# My Wet Fantasy League Hub

Static first-pass template modeled after the Row Fast Eat Ass league hub.

## Included

- Overview shell for the 14-team, one-division league, weekly matchups, and prize-pool placeholders
- Power Rankings template with all 14 league teams
- Compact Methodology page
- Discord-inspired League Feed shell
- Responsive desktop and mobile layouts

The live build uses a Netlify function to read ESPN rosters, standings, projections, and matchups. Google login and the three feed channels use Supabase.

## Project configuration

- ESPN league ID: `64665002`
- Netlify production URL: `https://my-wet-fantasy.netlify.app`
- Supabase project ref: `jtofunhvvmyoemogiqyl`
- Authentication audience: external Google accounts ending in `@gmail.com`
- League format: 14 teams, one division, head-to-head half-PPR
- Roster: 14 players, nine starters, five bench spots, one IR slot
- Starting lineup: QB, RB, WR, TE, three FLEX, D/ST, K

The complete scoring and roster configuration is stored in `public/league-config.json` for the future ESPN sync and power-ranking model.

## One-time Supabase setup

Open the Supabase SQL Editor, paste the complete contents of `supabase/setup.sql`, and run it once. It creates profiles, messages, reactions, the `message-media` bucket, and Gmail-only row-level security policies.

## Netlify environment variables

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (the browser-safe publishable key)
- `ESPN_LEAGUE_ID=64665002`
- `ESPN_SEASON=2026`

The Google OAuth client must authorize `https://jtofunhvvmyoemogiqyl.supabase.co/auth/v1/callback`. Supabase's Site URL should be `https://my-wet-fantasy.netlify.app`.

## Week 0 power ranking model

- 65% optimized projected starting lineup
- 20% remaining RB/WR/TE depth
- 15% top-three RB/WR/TE star power

The three components are ranked within this 14-team league and translated to a 70–98 relative Team Strength score.

## Deploy on Netlify

1. Upload the contents of this folder to the root of the GitHub repository.
2. In Netlify, choose **Add new project → Import an existing project**.
3. Select the GitHub repository.
4. Netlify will read `netlify.toml`; there is no build command and the publish directory is `public`.
5. Deploy the site.

## Next phase

The live phase will add the ESPN server connection, Supabase schema and storage, Google authentication, league-member profiles, live standings and schedules, power rankings, and interactive feed features.
