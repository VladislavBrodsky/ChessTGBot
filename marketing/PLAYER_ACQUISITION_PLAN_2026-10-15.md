# Web3Chess plan to reach 10000 daily players

Prepared 15 October 2026 for a **10,000 daily active player destination** and **less than $1,000 in acquisition spending over the first 90 days**, excluding engineering and hosting.

**Build growth around recurring community chess sessions, useful puzzles, and free invitations between friends.** The first 90 days should prove that these loops produce returning players. Current retention and distribution evidence does not support promising 10,000 DAU in that period. The platform also needs the fixes and capacity gates in the [scale readiness assessment](../backend/ops/SCALE_READINESS_2026-10-15.md).

Implementation status: free friend challenges and community campaign links are implemented, with the rollout and validation steps in the [pilot release checklist](../backend/ops/PILOT_RELEASE_2026-10-15.md). The first dashboard version measures accepted-move players and retention from the first recorded playing day. Its source “players” count is **not** the qualifying-completion activation defined below. Historical exposure, full funnel joins, last-touch campaigns, and completed-game activation remain follow-up analytics work; report these unknown until implemented.

## Define success and the size of the target

Count gameplay DAU as distinct authenticated human players making a server-accepted move in a UTC day. Exclude passive opens, reward-only check-ins, signups without play, bot identities, staff, and test accounts. Report completed-game DAU and human-versus-AI play separately.

For acquisition, activation means a new player completes a qualifying game within 24 hours of registration: a supported completed result, at least 20 half-moves, and no aborted/test game. This is a proposed analytics definition; it does not change existing quest or referral rewards. Measure beginner drop-off and real short checkmates separately so the minimum-length rule does not hide their experience.

The audience requirement depends on retention. The following is a planning model, not measured product performance:

| Assumed ratio | Implication for 10,000 DAU |
| --- | ---: |
| DAU is 25% of monthly active players | 40,000 monthly active players |
| Monthly active players are 40% of all registered players | 100,000 cumulative registrations |
| 50% of registrations activate | 50,000 cumulative activated players |
| 35% of qualified landing visitors register | About 286,000 distinct qualified visits to produce those registrations |

These assumptions must hold together and cannot predict a launch date. At a $900 acquisition ceiling, 100,000 registrations would imply **$0.009 cash per registration**, requiring substantial unpaid partner distribution and founder labor. A low cash budget can validate an organic engine; it cannot purchase this audience. Ten thousand registrations alone would be far short of the requested target.

## Positioning and initial audience

Lead with **chess inside the conversation**: a useful position, a familiar rival, and a reason to play again. Start with adult casual and improving chess players already using Telegram. Prioritize active adult chess groups, coaches serving adult learners, small board-analysis creators, and existing players who can bring a real rival. Test English and Russian as separate cohorts where a host can support them; choose the first cohort through interviews and partner response, rather than splitting effort across every supported language.

Make free practice the immediate entry. Offer a human game during a hosted session. Show wallet and optional staked play only in their accurate, eligible context; deposits are not an acquisition objective. Avoid earnings promises, invented activity, unsupported anti-cheat claims, and unfunded prize announcements.

The strongest differentiation to test is convenience and social continuity. Validate it against familiar alternatives by observing whether a player can start, finish, invite, and return with less friction. Do not claim that the product has better chess analysis, fairness, or matchmaking than established platforms without evidence.

## Product changes needed for organic growth

| Priority | Current gap | Concrete result needed |
| --- | --- | --- |
| Before inviting groups | New game creation requires at least a $1 stake for direct human invitations | A verified free friend challenge and free rematch, with no deposit or wallet requirement |
| Before attributing campaigns | Unknown `startapp` codes can route to nonexistent game IDs | One allowlisted launch-token system resolving the destination, campaign, inviter, and creative; deduped backend attribution |
| Before claiming referral success | Existing referral activation requires three qualifying staked human games | Separate free-player invitation, activation, and retention metrics; preserve paid referral qualification and money rules |
| Before promoting the quest | Existing kit promises AI games; current server excludes AI and does not restrict eligibility to zero stakes | One tested eligibility contract across server, catalog, UI, and captions, with existing enrollment promises reconciled |
| Before using social proof | Lobby counts are padded and some admin marketing figures are fixed | Real counts, honest unavailable states, and verified source exports |
| Before a large creator session | Matchmaking, shared state, transport, and ownership risks remain | Pass the staged capacity/recovery gates and publish an internal event ceiling |

The public quest catalog was available and enabled during the review. That does not verify a complete claim journey. Until copy and eligibility agree, promote free practice and useful puzzles without promising a quest reward.

Use current working links for ordinary launch and real game invitations. A proposed `mk_*` or combined inviter/campaign token is **not usable until the resolver ships**. Telegram supports launch parameters and user-initiated sharing, but the application must interpret and validate them. [Telegram Mini Apps documentation](https://core.telegram.org/bots/webapps)

## Three acquisition loops

### Community session loop

Recruit a host with an active adult chess group. Give the host one original puzzle, a 20-second product demonstration, a concise player guide, a verified free-play path, and a support contact. Start with a 30-minute session in one shared time control. Confirm the time with that audience and show its local timezone; keep internal scheduling in UTC.

The host posts the invitation under the group's rules. Players solve the puzzle, join the session, finish a game, and optionally invite a rival to the next session. Share a real recap with permission and announce the next confirmed session. Keep one well-attended window before adding another. The current default Arena schedule has four daily windows; choose promotion around a verified window and evaluate concentrating the schedule if attendance is thin. A schedule change is proposed, not applied by this plan.

Start with three pilot communities, then ten, then twenty that actually send players. Count an active partner only when its players activate and return; an agreed cross-promotion or large member count is insufficient. A host must not promise separate club rankings or tournament features that the product does not yet provide.

### Puzzle relay loop

Publish one verified position with a clear challenge. Give the solution and explanation in the same post sequence. Invite the reader to forward the position to one chess friend and compare ideas. Use the existing website puzzle/share experience where verified, then offer relevant practice or the next hosted session.

Measure recipient landing, genuine solve without reveal, authenticated arrival, first game, and return. A share button tap is intent; it does not prove a send or a recipient. Repurpose the same original position into a Telegram post, short board video, and a useful article only when it warrants one. This follows the [existing SEO operating system](../website/docs/SEO_GROWTH_OPERATING_SYSTEM_2026-10-15.md); it does not require daily generic blog production.

### Rival and rematch loop

After a completed free game, offer a free rematch or a user-initiated invitation with a specific purpose: “Bring the friend who always spots your hanging queen.” The recipient should reach that challenge, with the original inviter and campaign preserved, then get their own invitation after playing.

This loop depends on the new free direct-challenge path. Until it ships, use puzzle sharing and scheduled free matchmaking instead of advertising a free private match. Test an earned non-transferable duo badge only after attribution and deterministic fulfillment exist; the badge is a proposal, not an available reward. Do not pay for link clicks, signups, or forced forwarding.

## Retention creates the daily audience

| Player moment | Proposed next action | Evidence to inspect |
| --- | --- | --- |
| First arrival | Start free practice or enter the confirmed free session; explain one task at a time | Time to first accepted move and first completed game |
| First game ends | Choose one improvement and offer a rematch | Second-game completion and reported friction |
| Next day | A fresh related puzzle or a chosen return session | Day-1 gameplay return |
| Three completed games | Show real progress; offer an optional invitation | Repeat play and activated invitees, not reward claims alone |
| First week | Invite the player back to a familiar host/rival | Day-7 return and human games per returning player |
| Inactivity | One useful comeback invitation if messaging permission and frequency rules allow | Incremental return versus a holdout; blocks and opt-outs |

Lifecycle messaging is a proposed implementation. Existing marketing broadcasts run on a fixed schedule; the engagement kit's recommender does not itself deliver private messages. Require opt-in, durable send receipts, blocked/opted-out suppression, and a shared frequency cap before adding delivery. Coordinate all senders so campaigns do not stack.

Use the existing kit's ceiling of one marketing message per 24 hours and three per rolling seven days, with fewer sends when no relevant event exists. Reserve delivery capacity for match and money notifications. Telegram documents a default bulk limit of about 30 messages/second; its 10,000-recipient floor is therefore about 5.6 minutes before network and other delivery costs. The current scheduler's 0.05-second sleep alone means at least 8.3 minutes for 10,000 recipients. Send confirmed event reminders early, spread delivery, and respect retry instructions. [Telegram Bot FAQ](https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this)

## Ninety day execution plan

The count ranges below are **pilot planning targets**, not forecasts, and are cumulative where stated. Advancing depends on quality and capacity. If a gate fails, spend the next period repairing that step instead of increasing promotion.

| Period | Actions | Target and decision gate |
| --- | --- | --- |
| Days 1–14 | Founder interviews ten adult players and observes ten complete journeys. Product/backend owners address the launch blockers. Build a list of 30 suitable groups/coaches/creators and prepare three individual pilot proposals. Verify measurement and a 100-session staging run. | Reliable first game, exact quest rules, real counters, three willing hosts. Keep public recruitment small if the free invite or tracking path is unfinished. |
| Days 15–30 | Run two hosted sessions each week across three pilot communities. Publish three useful puzzle/lesson posts and two original short demonstrations weekly. Observe the first 50–100 new players. | 100–300 registrations and 50–150 activations cumulatively; enough qualitative evidence to repair onboarding. Do not declare statistical winners from these small cohorts. |
| Days 31–60 | Repeat the best session format; grow toward ten active partners. Ask each successful host for one relevant host introduction. Launch the free rival loop after verification. Run at most two small creator pilots. | 500–1,500 registrations and 250–750 activations cumulatively; target 50–150 gameplay DAU. Seek two matured cohorts meeting retention gates. |
| Days 61–90 | Grow toward twenty active partners and one dependable daily play window if turnout supports it. Reuse proven assets; stop weak formats. Publish true weekly outcomes and work with hosts whose players return. | 1,500–3,000 registrations and 750–1,500 activations cumulatively; target 100–300 gameplay DAU. A 1,000-DAU result is a stretch, requiring stronger distribution/retention than assumed here. |

Owner capacity assumption: a founder/growth lead contributes 12–18 hours per week to partner relationships, sessions, and measurement; a chess editor/community host contributes 4–6 hours; engineering and support time are funded separately. Without that labor, reduce scope and extend the timeline.

Weekly rhythm: Monday reviews mature cohorts and chooses one bottleneck; Tuesday prepares the puzzle/demo kit; Wednesday and Saturday host sessions; Thursday publishes the explanation and follows up with consenting pilot players; Friday reviews partner results and prepares the next invitations. Keep the official channel useful between offers. This is a proposed cadence, not a newly enabled automation or publishing instruction.

## Cash budget

| Proposed allocation | Maximum |
| --- | ---: |
| Partner session support and reusable host kits | $250 |
| Two creator experiments, after tracking and activation gates | $200 |
| Editing and reusable short-video assets | $150 |
| Language review and player research expenses | $100 |
| Incremental distribution/analytics tools if existing tools are insufficient | $50 |
| Contingency held until a measured need appears | $150 |
| **Total acquisition ceiling** | **$900** |

No money is spent or committed by this plan. Use existing templates, website, analytics, and free tools first. Proposed creator experiment caps are $100 each, not market price estimates; select only partners who accept that scope or collaborate without cash. Require a clear deliverable and an attributed outcome review before repeating. Keep cash prizes, purchased followers, mass messaging, and paid traffic out of this budget.

Telegram Ads currently prohibits promotion of real-money gaming and games involving prizes or goods of value. The product's staked matches and reward destination create an eligibility concern even when an ad headline mentions free chess. Do not fund Telegram Ads without confirming eligibility of the full destination and relevant markets; do not conceal the money features to obtain approval. Creator and community distribution must also follow their platform rules. [Telegram Ads guidelines](https://ads.telegram.org/guidelines)

## Measurement and experiments

Make one weekly cohort report from backend gameplay and deduped registration records. Use one canonical player identifier. Store first acquisition source, most recent campaign, and inviter separately so a forwarded challenge does not overwrite the original source. Attribute each new player once in channel totals; report returning players separately. Publish unknown source when attribution is absent.

Required stages: verified partner/content exposure when available → landing → authenticated arrival → registration → accepted move → qualifying completion → second game → Day-1/Day-7/Day-30 return. Proposed event names and launch-token routing are implementation work, not an assertion that these joins already exist. Keep Telegram credentials, wallet addresses, display names, and raw private-chat data out of marketing analytics.

Define exact-day retention from first activation in UTC: the proportion of that cohort playing again on day 1, 7, or 30. Include only cohorts old enough to reach the relevant day, report numerator and denominator, and additionally report rolling seven-day return for small cohorts. Share impressions and reactions separately from gameplay results.

| Experiment | Hypothesis | Primary outcome and decision |
| --- | --- | --- |
| Hosted window versus scattered invitations | Concentrating arrivals makes a compatible human opponent available | Completed human games per authenticated newcomer; queue wait when compatible opponents exist. Repeat across at least three sessions. |
| Rival invitation versus generic product link | A named challenge gives a recipient a reason to play | Activated invitees per eligible inviter over seven days; requires free challenge and attribution implementation. |
| One-move explanation versus product promotion | Immediate chess value brings more returning players | Day-7 returning players per 100 attributed arrivals; keep format/channel comparable. |
| Relevant return reminder versus holdout | A useful prompt increases play without excess blocking | Incremental returning players among eligible opted-in users; suppress reminders for the randomized holdout. Requires delivery and assignment implementation. |

Proposed expansion gates: at least 50% registration-to-activation, Day-1 return ≥30%, Day-7 ≥15%, and Day-30 ≥8%, with at least 100 matured activated players for the corresponding retention readout. Treat those as early operating thresholds, not industry benchmarks or statistical proof. Look for repeat results in two cohorts. A low activation rate means fix entry; low Day-7 means fix repeat value; a high share rate with few recipient games means fix the invitation path. Stop expanding immediately for money inconsistencies, incorrect quest promises, or lost accepted moves.

Define the viral coefficient **K** as new activated invitees produced per activated player in a fixed seven-day window, counting unique invitees once. For diagnosis, decompose it into invitation participation × distinct recipients per sharer × recipient registration × registration activation. Example assumptions of 30% × 3 × 40% × 60% yield **K = 0.216**. That helps growth but does not sustain it alone. In an idealized unlimited sequence with no overlap or changing conversion, it multiplies a seed cohort by only about 1.28. Aim first for K ≥0.2, then ≥0.4 across repeated cohorts; retain partner distribution while K is below 1.

## Path from the pilot to 10000 daily players

| Gameplay milestone | What must be repeatable before advancing |
| --- | --- |
| 100 DAU | A small number of communities repeatedly deliver first games and weekly returns |
| 1,000 DAU | Partner onboarding is documented; a trained host can run a session; at least two independent distribution sources work; referral attribution and free invites function |
| 3,000 DAU | Partner retention and player cohorts remain healthy outside founder-hosted sessions; support, moderation, and fair-play reporting scale with demand |
| 10,000 DAU | Approximately 40,000 MAU under the 25% assumption; infrastructure passes the actual peak profile; distribution replaces churn without exhausting hosts or rewards |

For an illustrative mature community model, **100 active partners × 400 distinct monthly players = 40,000 MAU**. At 25% daily participation that supports 10,000 DAU. Real communities overlap, so the required raw audience is larger. This is a way to size the distribution job, not evidence that 100 partners or those audiences have been secured. If observed daily participation is only 10%, the same MAU produces 4,000 DAU and the target needs 100,000 MAU.

Give each successful host a reusable session kit and a referral to another host; train returning players as volunteer hosts only with explicit agreement. Diversify communities so one partner cannot remove most daily activity. Do not use a growing reward liability to disguise declining organic return.

## Copy and creative production

Use these as draft hooks after verifying their referenced feature. They have no terminal periods for use on social canvases:

- Practice: **One game today, one better decision tomorrow**
- Puzzle relay: **Find the move, then send it to your toughest chess friend**
- Community session: **Your group chat has a board waiting**
- After the free friend flow ships: **Bring your rival, leave the wallet closed**

A session announcement must include the confirmed date, local timezone, exact free mode, and working destination. A quest announcement must include its actual qualifying games and reward rules. Use real match recaps only with player permission; show actual milestones instead of financial winner stories.

All generated banners and posts must follow [the canvas style guide](templates/CANVAS_STYLE_GUIDE.md): monochrome text-only logo, contextual Phosphor icons, compact proof rows, transparent canvas integration, dual actions with the mint URL pill, and no terminal periods in UI copy. These rules take precedence over older documents suggesting a purple rook, guaranteed prizes, artificial urgency, or unverified conversion claims. Website work uses the Fog Board design system; Mini App work uses its existing shared primitives and Obsidian rules.

The existing [content strategy](content-ops/STRATEGY.md) and [engagement kit](engagement/README.md) supply reusable assets and editorial concepts. Use this plan for the 10,000-DAU objective, current product dependencies, spending ceiling, acquisition measurement, and launch sequence. Reconcile stale quest language before reusing that kit.
