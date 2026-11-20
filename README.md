# ECE 3610 Final Course Trials — Leaderboard

Static site for GitHub Pages + a Google Sheet backend (via Apps Script).

| Page | Who | What |
|---|---|---|
| `index.html` | Viewers | Leaderboard, podium, YouTube live stream, timer, spotlight, How It Works |
| `admin.html` | Instructor | Team on course, up next, stopwatch, record/edit/delete runs |
| `submit.html` | Students | Team card: team name (typed), robot name, robot photo, three comment prompts. No student names. |
| `rules.html` | Anyone | Standalone How It Works page |

Everything you'd normally change is in **`assets/config.js`**.

---

## 0. Try it first (demo mode)
With `API_URL` empty, the site runs on sample data stored in your browser.
Open `index.html` and `admin.html` in two tabs of the same browser. Changes in the admin tab show up on the leaderboard immediately.
To reset the demo data, run `localStorage.removeItem("ece3610_trials_demo_v1")` in the browser console.

## 1. Google Sheet + Apps Script
1. Create a new Google Sheet (use a **personal Gmail account** if your university Workspace blocks "Anyone with the link" sharing. Photos need it).
2. **Extensions → Apps Script**. Replace `Code.gs` with `apps-script/Code.gs`.
3. Set your keys (never put them in `Code.gs`; this repo is public):
   **Project Settings (gear icon) → Script Properties → Add script property**
   - `ADMIN_KEY`: your private key for `admin.html`
   - `SUBMIT_CODE`: the code you give students for `submit.html`
4. Select `setup` in the function dropdown → **Run** → approve permissions.
   This creates the `Teams`, `Runs` and `State` tabs plus a Drive folder for photos.
5. Teams are added to the **Teams** tab automatically when they submit a team card, and then appear in your admin dropdowns.
   You can also type a name in the `Team` column yourself (e.g. for a team that hasn't submitted yet).
   Duplicate or misspelled names can be fixed or deleted directly in the sheet.
6. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Copy the Web app URL (ends in `/exec`) into `API_URL` in `assets/config.js`.

> If you edit `Code.gs` later: **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. The URL stays the same.

## 2. GitHub Pages
1. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / `(root)` → Save**.
2. Site: `https://profb-1111.github.io/ece3610-trials/` (first deploy takes about a minute; every push redeploys).
   - Leaderboard: `/` · Students: `/submit.html` · You: `/admin.html` · Rules: `/rules.html`

## 3. Logos
The logos are in `assets/logos/` and listed under `LOGOS` in `config.js`. They sit on a white plate in the header, in their official colors. The Namdaemun icon is recolored to Utah Red `#BE0000`. Adjust each logo's `height` (px) if needed.

## 4. YouTube live stream
**At least 24 h before race day** (first-time enablement can take up to 24 h):
1. YouTube → **Create → Go live**. Verify the channel by phone if asked.
2. Once it's enabled, schedule a **webcam** stream (laptop or USB webcam, no OBS needed):
   - Visibility: **Unlisted**
   - Audience: **No, it's not made for kids** (otherwise embedding is limited)
   - Make sure **Allow embedding** is on
3. Copy the video ID from the stream's watch URL (`watch?v=XXXXXXXXXXX`) into `YOUTUBE_ID` in `config.js`.
   The ID stays the same from scheduling to going live, so you can set it days ahead.
4. Do a test run on the course network.

The page embeds the stream muted with autoplay (browsers require this). Viewers can unmute it in the player.

### Calibrating `STREAM_DELAY_MS`
The video runs a few seconds behind real life. The page holds back the timer, results and celebrations by `STREAM_DELAY_MS`, so they line up with the video.
1. Go live and point the webcam at the laptop screen showing `admin.html`.
2. On another device, open the leaderboard with a test delay, e.g. `.../index.html?delay=5000`.
3. Select any team and start the stopwatch. The page timer should match the stopwatch digits **seen in the video**.
   - Page timer ahead of the video → increase the delay. Behind → decrease it.
4. Put the value that matches into `STREAM_DELAY_MS` in `config.js` and push.

Latency differs a little between viewers (YouTube says most see under 5 s), so pick a value for a typical connection.
`?cam=local` shows a webcam plugged into the viewing computer with no delay (handy for testing).

## 5. Race-day workflow (admin.html)
1. Enter the admin key once (saved in that browser).
2. **Up next**: pick the next team. The leaderboard shows an "Up next" tag.
3. **Send to course ↑** (or choose from the top dropdown): the team becomes "At the start line".
4. **Space** = start / stop. The leaderboard shows a live running clock.
5. Check the time (it's editable), choose Completed / DNF / DQ, then **Enter** = save.
6. Mistakes: use Edit / Delete in the Run log, or edit the `Runs` sheet directly.

Keys: `Space` start/stop · `Enter` save · `Esc` reset (press twice while running).

## Notes
- **Anonymity:** the site never asks for or publishes student names. Only the Team, Robot, Comment, Interesting, Learned and PhotoURL columns are published; anything else in the sheet stays private. If your sheet was created with an older version that had a `Members` column, delete that column.
- **Team card prompts** (questions, example text, card headings) are in `CARD_PROMPTS` in `config.js`.
- **Ranking:** best single completed run. Ties are broken by average time. The top `EXTRA_CREDIT_SPOTS` teams get the extra-credit badge.
- **Official time** comes from the admin stopwatch, which is precise to the millisecond on your machine. The leaderboard replays each start and stop at the real event time plus `STREAM_DELAY_MS`. The final time shown is always the recorded one.
- **Refresh rate:** the leaderboard checks every `POLL_MS` (4 s), or every `POLL_FAST_MS` (1.5 s) while a team is on course. Reads are cached for 2 s in Apps Script, so many viewers don't slow it down. Keep `STREAM_DELAY_MS` above about 2 s so updates arrive before they need to be shown.
- **Security:** reads are public. Every write needs `ADMIN_KEY` or `SUBMIT_CODE`, which live only in Apps Script's Script Properties and never in this repo. `admin.html` is public but useless without the key.
- **Photos** are resized in the browser to 1200 px JPEG, then saved to Drive. When a team resubmits, the old photo goes to the Drive trash.
