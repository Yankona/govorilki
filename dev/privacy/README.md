# Privacy: where the data goes (v164)

The owner's decisions of 17.11.2026 (all in `proposal.html`): stop the author summary; family channel off public ntfy;
own fonts and voice engine; 90-day journal on the phone; anonymous day counters only with the parents' tick, kept
13 months by day, then by month; second parent equal; errors only with the tick; Google speech recognition off by
default in the EU; contact privacy@govorilki.com (a draft address: the owner creates the mailbox before the policy goes live); controller = the owner; therapist role later.

| What | Where | How long | Basis | Code |
|---|---|---|---|---|
| Profiles, stars, settings, drawings, voice recordings | the phone (`govorilki-v2`, IndexedDB) | until «Удалить всё» | needed for the game | — |
| Journal (app open/close, page open/close with how and seconds, games, steps, doors, stories, errors) | the phone (`govorilki-ev`) | 90 days | needed for «Отчёт» | `EVENTS-BEGIN` |
| Family login, kids' profiles | Worker + D1 (`families`, `kids`, `tokens`) | until deleted | contract | `cloud/worker.js` |
| Family channel (relatives, chess, leagues, lobby) | D1 `relay`, sealed on the phone (key from the channel name) | 12 hours | contract | `RCH`, `/v1/ch` |
| Anonymous day counters | D1 `stats_day` → `stats_month` | 13 months by day | consent (`ROOT.consent.stats`) | `EVT.send`, `/v1/stats` |
| Failed-login / rate counters with the address | D1 `ipfails` | ≤ 1 day (daily job) | legitimate interest (security) | `daily()` |
| Idea letters | D1 `ideas`, sealed for the author | last 3000 | consent (the parent writes) | `/v1/idea` |

Still third parties: the Piper voice model from Hugging Face (63 MB, over the 25 MB Pages limit: needs R2 or chunks);
Google speech recognition in Chrome (off by default in the EU); ElevenLabs only with the parent's own key; links the
child or parent taps (Lichess, YouTube, Wikipedia). The claude.ai copy (EMBEDDED) sends nothing to our server.

Never in the journal or the counters: text a person typed, names, recordings, precise place, device fingerprints, the page
address (relatives' links carry the family code after #). JS errors keep only the line number.

Deploy: `cloud/` changes deploy with the release (cloud.yml applies `migrations/0004_relay.sql`, `0005_stats.sql`
and the cron trigger in `wrangler.toml`). The D1 database was created without an EU jurisdiction; moving it needs a new
database created with `--jurisdiction eu` and a copy of the data (owner's decision, a separate task).

Tests: `tests/privacy_hotfix.js`, `tests/privacy_events.js` (4 languages, phone/laptop), `tests/cloud_relay.mjs`,
`tests/cloud_stats.mjs` (Worker on node:sqlite).
